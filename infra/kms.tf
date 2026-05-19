resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} — encrypts Secrets Manager and EKS etcd"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = { Name = "${local.name_prefix}-kms" }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}
