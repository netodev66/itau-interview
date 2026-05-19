variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "itau-messages"
}

variable "environment" {
  type    = string
  default = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment must be development, staging or production."
  }
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "eks_cluster_version" {
  type    = string
  default = "1.31"
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "dynamodb_table" {
  type    = string
  default = "Messages"
}
