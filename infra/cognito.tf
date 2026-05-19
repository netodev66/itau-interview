resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
  }

  tags = { Name = "${local.name_prefix}-user-pool" }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${local.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Backend API: client secret stored securely in the server, never exposed to the browser
  generate_secret = true

  # ALLOW_USER_PASSWORD_AUTH: backend sends credentials directly to Cognito InitiateAuth
  # ALLOW_ADMIN_USER_PASSWORD_AUTH: allows server-side admin flows via admin API (requires AWS credentials)
  # ALLOW_REFRESH_TOKEN_AUTH: allows the backend to silently refresh tokens
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Prevent token exchange from browser origins — backend only
  allowed_oauth_flows_user_pool_client = false

  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}
