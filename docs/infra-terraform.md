# Infraestrutura Terraform
## Visão geral

```
Internet
    │
    ▼
API Gateway HTTP API  ──── Cognito JWT Authorizer
    │
    │  VPC Link
    ▼
NLB (interno)
    │
    ▼
EKS Fargate Pods (namespace: app)
    │  env vars injetadas pelo K8s (process.env.*)
    │  ├── NODE_ENV, PORT          ← ConfigMap
    │  ├── COGNITO_*               ┐
    │  ├── DYNAMODB_TABLE_ARN      ├── Kubernetes Secret  ←  External Secrets Operator
    │  └── AWS_REGION              ┘         │
    │                                        │ GetSecretValue (IRSA)
    │                                        ▼
    │                                 AWS Secrets Manager
    │                                 (cifrado com KMS)
    │
    └── DynamoDB  (via VPC Endpoint gateway)
```
