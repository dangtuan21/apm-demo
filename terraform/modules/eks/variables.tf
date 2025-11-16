# EKS Module Variables

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "node_group_instance_types" {
  description = "Instance types for EKS node group"
  type        = list(string)
}

variable "node_group_capacity_type" {
  description = "Capacity type for node group (ON_DEMAND or SPOT)"
  type        = string
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

# Removed key_pair_name variable - SSH access can be added later if needed
