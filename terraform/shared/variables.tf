# Shared variables for APM Demo EKS deployment

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
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
}

# EKS Node Group Configuration
variable "node_group_instance_types" {
  description = "Instance types for EKS node group"
  type        = list(string)
}

variable "node_group_capacity_type" {
  description = "Capacity type for node group (ON_DEMAND or SPOT)"
  type        = string
  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_group_capacity_type)
    error_message = "Capacity type must be ON_DEMAND or SPOT."
  }
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in node group"
  type        = number
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in node group"
  type        = number
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in node group"
  type        = number
}

# Monitoring Configuration
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

# Application Configuration
variable "backend_image_tag" {
  description = "Docker image tag for backend"
  type        = string
  default     = "latest"
}

variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
}

variable "enable_hpa" {
  description = "Enable Horizontal Pod Autoscaler"
  type        = bool
  default     = true
}
