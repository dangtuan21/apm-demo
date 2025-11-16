# APM Demo EKS Development Environment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "apm-demo"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  cluster_name       = var.cluster_name
  vpc_cidr          = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)
  environment       = var.environment
}

# ECR Module
module "ecr" {
  source = "../../modules/ecr"

  repository_name = var.repository_name
  environment     = var.environment
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  environment     = var.environment

  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids

  node_group_instance_types = var.node_group_instance_types
  node_group_capacity_type  = var.node_group_capacity_type
  node_group_min_size      = var.node_group_min_size
  node_group_max_size      = var.node_group_max_size
  node_group_desired_size  = var.node_group_desired_size

  depends_on = [module.vpc]
}

# Configure Kubernetes provider
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}
