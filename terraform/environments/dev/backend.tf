# Terraform Backend Configuration for Development Environment

terraform {
  backend "s3" {
    bucket  = "apm-demo-terraform-state-dev-741543764817"
    key     = "dev/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
