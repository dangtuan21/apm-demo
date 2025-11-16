# Terraform Backend Configuration for Production Environment

terraform {
  backend "s3" {
    bucket  = "apm-demo-terraform-state-prod-741543764817"
    key     = "prod/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
