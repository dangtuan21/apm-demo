# Production Environment Configuration

# Environment
environment = "prod"
aws_region  = "us-east-1"

# Cluster Configuration
cluster_name    = "apm-demo-prod-east"
cluster_version = "1.28"

# VPC Configuration (different CIDR from dev)
vpc_cidr = "10.1.0.0/16"

# ECR Configuration
repository_name = "apm-backend"

# Production-grade EKS settings
node_group_instance_types = ["t3.medium"]
node_group_capacity_type  = "ON_DEMAND"
node_group_min_size      = 3
node_group_max_size      = 10
node_group_desired_size  = 5

# Application Configuration
backend_replicas = 5
enable_hpa      = true

# Full monitoring stack for production
enable_prometheus = true
enable_grafana   = true
