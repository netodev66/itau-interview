# itau-messages — Arquitetura de Infraestrutura

> Diagrama interativo: abra `docs/architecture.drawio` no [draw.io](https://app.diagrams.net).

---

## Visão Geral

```
Client ──HTTPS──► API Gateway HTTP API v2 ──VPC Link──► NLB ──► EKS Fargate Pods ──SDK──► DynamoDB
                        │                                              │
                   JWT Authorizer                              Fluent Bit (sidecar)
                        │                                              │
                   Cognito User Pool                        CW Log Group /pods
                        │
               CloudWatch Alarms ──► SNS ──► Email
```

---

## Componentes

### Entrada

| Componente | Descrição |
|---|---|
| **API Gateway HTTP API v2** | Único ponto de entrada público. Roteia `/api/v1/auth/{proxy+}` sem autenticação e `/api/v1/{proxy+}` com JWT obrigatório. Injeta `x-request-id` em cada request para correlação de logs. |
| **JWT Authorizer** | Valida tokens Cognito na borda, antes do request chegar aos pods. Rejeita tokens inválidos com 401 sem custo de compute. |
| **Cognito User Pool** | Emite e valida tokens JWT (access + id + refresh). Único ponto de autenticação — não há segredo de senha no backend. |

### Rede

| Componente | Descrição |
|---|---|
| **VPC (10.0.0.0/16)** | Isolamento de rede. Subnets públicas expõem apenas o VPC Link; pods ficam em subnets privadas sem IP público. |
| **VPC Link** | Túnel privado entre API Gateway e NLB. O tráfego nunca sai para a internet. |
| **Internal NLB** | Distribui carga entre pods usando o IP do pod diretamente (`target_type = ip`), obrigatório para Fargate. |

### Compute

| Componente | Descrição |
|---|---|
| **EKS Fargate** | Pods sem gerenciamento de nó. Cada pod roda em microVM isolada. `Fargate Profile: app` mapeia o namespace `app`. |
| **NestJS App** | API RESTful com ClusterMode (`CLUSTER_MODE=true`) — `os.cpus().length` workers por pod. |
| **HPA** | Escala de 2 a 10 pods com gatilho em 75% de CPU (1,5 vCPU de 2). |
| **Fluent Bit (sidecar)** | Coleta `stdout/stderr` dos containers, parseia JSON (Pino), encaminha para CloudWatch Logs. Ativado pelo ConfigMap `aws-logging` no namespace `aws-observability`. |

### Banco de Dados

| Componente | Descrição |
|---|---|
| **DynamoDB (single-table)** | Tabela `Messages`. Sem servidor gerenciado, escala automática. Dados criptografados com KMS. |
| **GSI_DATE** | Índice por data para `findByDateRange`. SK composto `ISO-timestamp#uuid` permite `BETWEEN` preciso sem filtro em memória. Máx. 90 dias por query (validado no DTO). |
| **GSI_SENDER** | Índice por remetente para `findBySender`. |

#### Schema DynamoDB

```
Tabela: Messages
────────────────────────────────────────────────────────
  PK           │ Atributos
  MSG#{id}     │ id, content, sender, sentAt, status

GSI_DATE
────────────────────────────────────────────────────────
  GSI_DATE_PK              │ GSI_DATE_SK
  MESSAGES#YYYY-MM-DD      │ ISO-timestamp#uuid

GSI_SENDER
────────────────────────────────────────────────────────
  GSI_SENDER_PK   │ GSI_SENDER_SK
  SENDER#{uuid}   │ ISO-timestamp#uuid
```

**Padrão do SK composto:** `2026-05-10T17:00:40.676Z#550e8400-...`
- Ordena por tempo dentro de cada partição
- `~` como sufixo de fim garante que todos os UUIDs fiquem dentro do `BETWEEN`
- Dias inteiros usam `T00:00:00.000Z#` / `T23:59:59.999Z#~`; dias parciais usam o timestamp exato

### Segurança

| Componente | Descrição |
|---|---|
| **KMS** | Chave gerenciada pelo cliente para criptografia em repouso: DynamoDB, Secrets Manager, etcd do EKS. |
| **Secrets Manager** | Armazena `COGNITO_CLIENT_SECRET`, `DYNAMODB_TABLE` e demais segredos. Pods acessam via IRSA (sem credenciais estáticas). |
| **IRSA** | IAM Role para Service Account. O pod assina chamadas AWS com o token OIDC do EKS — sem `AWS_ACCESS_KEY_ID` em variáveis de ambiente. |
| **Pino `redact`** | `authorization`, `password` e `refreshToken` são substituídos por `[REDACTED]` em todos os logs antes de qualquer envio. |

### Monitoramento e Logs

| Componente | Configuração | Ação |
|---|---|---|
| **CW Alarm: 5xx rate** | > 1% em 2 janelas de 5 min | SNS → Email |
| **CW Alarm: 4xx rate** | > 10% em 2 janelas de 5 min | SNS → Email |
| **CW Alarm: Latency P99** | > 2000 ms em 3 min consecutivos | SNS → Email |
| **CW Alarm: Integration P99** | > 1500 ms em 3 min consecutivos | SNS → Email |
| **CW Log Group: API GW** | Retenção 14 dias | Log estruturado JSON com `requestId` |
| **CW Log Group: Pods** | Retenção 30 dias, KMS | JSON Pino com `x-request-id` para correlação |

**Correlação de logs end-to-end:**
```
API Gateway access log { requestId: "abc-123", ... }
                   ↕  mesmo ID
Pod log { requestId: "abc-123", level: "info", msg: "login attempt", ... }
```
O API Gateway injeta `$context.requestId` como `x-request-id` em cada request; o Pino lê o header via `genReqId` e inclui o ID em todas as linhas de log.

---

## Fluxo de Dados — POST /api/v1/messages

```
1. Client envia POST com Bearer token
2. API Gateway verifica JWT no Cognito (borda, sem custo de pod)
3. API Gateway injeta x-request-id e encaminha via VPC Link → NLB → Pod
4. NestJS valida DTO (whitelist, transform, stopAtFirstError)
5. MessagesService chama DynamoDBMessagesRepository.create()
6. PutItem na tabela com PK/SK + GSI_DATE_PK/SK + GSI_SENDER_PK/SK
7. Pino loga a request com x-request-id (authorization redacted)
8. Fluent Bit encaminha log para CW Log Group /aws/eks/*/pods
```

---

## Infraestrutura como Código

| Arquivo | Conteúdo |
|---|---|
| `infra/vpc.tf` | VPC, subnets, route tables |
| `infra/eks.tf` | EKS cluster, Fargate profiles, NLB, IAM roles, IRSA |
| `infra/api_gateway.tf` | HTTP API, JWT authorizer, routes, VPC link, access logs |
| `infra/cognito.tf` | User Pool, App Client, domain |
| `infra/monitoring.tf` | CloudWatch alarms, SNS, log groups, IAM para Fluent Bit |
| `infra/secrets.tf` | Secrets Manager |
| `infra/kms.tf` | KMS key + alias |
| `infra/ecr.tf` | ECR repository |
| `k8s/` | Deployment, HPA, Service, ServiceAccount, ExternalSecret, Fluent Bit ConfigMap |
