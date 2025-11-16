# Development Environment Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecr.repository_url
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "docker_login_command" {
  description = "Command to login to ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${module.ecr.repository_url}"
}

output "environment_info" {
  description = "Development environment information"
  value = {
    environment    = var.environment
    region        = var.aws_region
    cluster_name  = var.cluster_name
    node_type     = var.node_group_instance_types[0]
    capacity_type = var.node_group_capacity_type
    min_nodes     = var.node_group_min_size
    max_nodes     = var.node_group_max_size
  }
}
