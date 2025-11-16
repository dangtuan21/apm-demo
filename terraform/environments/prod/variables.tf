# Production Environment Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "apm-demo-prod"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "apm-backend"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# EKS Node Group Configuration (Production optimized)
variable "node_group_instance_types" {
  description = "Instance types for EKS node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_group_capacity_type" {
  description = "Capacity type for node group (ON_DEMAND for prod reliability)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in node group"
  type        = number
  default     = 3
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in node group"
  type        = number
  default     = 5
}

# Application Configuration
variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 5
}

variable "enable_hpa" {
  description = "Enable Horizontal Pod Autoscaler"
  type        = bool
  default     = true
}

# Monitoring Configuration (Full stack for prod)
variable "enable_prometheus" {
  description = "Enable Prometheus monitoring"
  type        = bool
  default     = true
}

variable "enable_grafana" {
  description = "Enable Grafana dashboards"
  type        = bool
  default     = true
}
