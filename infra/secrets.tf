data "aws_caller_identity" "current" {}

resource "aws_secretsmanager_secret" "app" {
  name       = "/${var.project}/${var.environment}/app"
  kms_key_id = aws_kms_key.main.arn

  tags = { Name = "${local.name_prefix}-secret" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    # ── Cognito ───────────────────────────────────────────────────────────────
    COGNITO_USER_POOL_ID  = aws_cognito_user_pool.main.id
    COGNITO_CLIENT_ID     = aws_cognito_user_pool_client.app.id
    COGNITO_CLIENT_SECRET = aws_cognito_user_pool_client.app.client_secret
    # Full issuer URL used to validate JWT signatures and build InitiateAuth calls
    COGNITO_ISSUER_URL    = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    COGNITO_DOMAIN        = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"

    # ── DynamoDB ──────────────────────────────────────────────────────────────
    DYNAMODB_TABLE     = var.dynamodb_table
    DYNAMODB_TABLE_ARN = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_table}"

    # ── AWS ───────────────────────────────────────────────────────────────────
    AWS_REGION = var.aws_region
  })
}

# ─── Resource-based policy: only the app pod role may read this secret ────────

resource "aws_secretsmanager_secret_policy" "app" {
  secret_arn = aws_secretsmanager_secret.app.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptAppRole"
        Effect = "Deny"
        Principal = { AWS = "*" }
        Action   = "secretsmanager:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalArn" = [
              aws_iam_role.app.arn,
              # Allow the account root to manage the secret (break-glass access)
              "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root",
            ]
          }
        }
      },
      {
        Sid    = "AllowAppPodRole"
        Effect = "Allow"
        Principal = { AWS = aws_iam_role.app.arn }
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = "*"
      }
    ]
  })
}

# ─── IAM identity-based policy on the app role ───────────────────────────────

resource "aws_iam_role_policy" "app_secrets" {
  name = "${local.name_prefix}-app-secrets-policy"
  role = aws_iam_role.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadAppSecret"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = aws_secretsmanager_secret.app.arn
      },
      {
        Sid      = "DecryptWithKMS"
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:DescribeKey"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}
