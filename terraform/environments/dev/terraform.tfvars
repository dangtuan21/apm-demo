# Development Environment Configuration

# Environment
environment = "dev"
aws_region  = "us-east-1"

# Cluster Configuration
cluster_name    = "apm-demo-dev-east"
cluster_version = "1.28"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# ECR Configuration
repository_name = "apm-backend"

# Cost-optimized EKS settings for development
node_group_instance_types = ["t3.small"]
node_group_capacity_type  = "ON_DEMAND"
node_group_min_size      = 1
node_group_max_size      = 3
node_group_desired_size  = 2

# Application Configuration
backend_replicas = 2
enable_hpa      = false

# Basic monitoring for development
enable_prometheus = true
enable_grafana   = false
