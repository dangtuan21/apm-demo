# 🚀 APM Demo EKS Terraform Deployment

This directory contains Terraform configurations to deploy the APM Demo application to Amazon EKS with separate dev and prod environments.

## 📁 Project Structure

```
terraform/
├── deploy.sh                   # Main deployment script
├── README.md                   # This file
├── environments/
│   ├── dev/                   # Development environment
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/                  # Production environment
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/                   # Reusable Terraform modules
│   ├── vpc/                  # VPC and networking
│   ├── eks/                  # EKS cluster and node groups
│   ├── ecr/                  # Container registry
│   └── monitoring/           # Monitoring stack (Prometheus/Grafana)
└── shared/                   # Shared variables and outputs
    ├── variables.tf
    └── outputs.tf
```

## 🏗️ Infrastructure Overview

### **Development Environment**
- **Region**: us-east-1
- **VPC CIDR**: 10.0.0.0/16
- **EKS Cluster**: apm-demo-dev-east
- **Node Type**: t3.small (SPOT instances for cost savings)
- **Nodes**: 1-3 nodes (desired: 2)
- **Application Replicas**: 2
- **Monitoring**: Basic Prometheus only

### **Production Environment**
- **Region**: us-east-1
- **VPC CIDR**: 10.1.0.0/16
- **EKS Cluster**: apm-demo-prod-east
- **Node Type**: t3.medium (ON_DEMAND for reliability)
- **Nodes**: 3-10 nodes (desired: 5)
- **Application Replicas**: 5
- **Monitoring**: Full Prometheus + Grafana stack

## 🔧 Prerequisites

1. **AWS CLI** configured with valid credentials
2. **Terraform** >= 1.0
3. **kubectl** for Kubernetes management
4. **Docker** for building container images

### **Setup AWS CLI**
```bash
aws configure
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

## 🚀 Quick Start

### **Deploy Development Environment**
```bash
# Navigate to terraform directory
cd terraform

# Deploy dev infrastructure
./deploy.sh dev apply

# Verify deployment
kubectl get nodes
kubectl get pods -A
```

### **Deploy Production Environment**
```bash
# Deploy prod infrastructure
./deploy.sh prod apply

# Verify deployment
kubectl get nodes
kubectl get pods -A
```

## 📋 Deployment Commands

### **Infrastructure Management**
```bash
# Plan changes (dry run)
./deploy.sh dev plan
./deploy.sh prod plan

# Apply changes
./deploy.sh dev apply
./deploy.sh prod apply

# Destroy infrastructure
./deploy.sh dev destroy
./deploy.sh prod destroy
```

### **Manual Terraform Commands**
```bash
# Development environment
cd environments/dev
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"

# Production environment
cd environments/prod
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

## 🐳 Container Image Management

### **Build and Push to ECR**
```bash
# Get ECR login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t apm-backend:latest -f k8s/Dockerfile backend/

# Tag for ECR
docker tag apm-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/apm-backend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/apm-backend:latest
```

### **Environment-Specific Tags**
```bash
# Development
docker tag apm-backend:latest <ecr-url>/apm-backend:dev
docker push <ecr-url>/apm-backend:dev

# Production
docker tag apm-backend:latest <ecr-url>/apm-backend:v1.0.0
docker push <ecr-url>/apm-backend:v1.0.0
```

## ⚙️ Configuration

### **Environment Variables**
Key configuration differences between environments:

| Setting | Development | Production |
|---------|-------------|------------|
| Instance Type | t3.small | t3.medium |
| Capacity Type | SPOT | ON_DEMAND |
| Min Nodes | 1 | 3 |
| Max Nodes | 3 | 10 |
| Desired Nodes | 2 | 5 |
| App Replicas | 2 | 5 |
| HPA Enabled | false | true |
| Grafana | false | true |

### **Customization**
Edit `terraform.tfvars` in each environment directory:

```hcl
# environments/dev/terraform.tfvars
node_group_instance_types = ["t3.small"]
node_group_capacity_type  = "SPOT"
backend_replicas = 2

# environments/prod/terraform.tfvars
node_group_instance_types = ["t3.medium"]
node_group_capacity_type  = "ON_DEMAND"
backend_replicas = 5
```

## 🔍 Monitoring & Observability

### **Access Monitoring**
```bash
# Port forward Grafana (prod only)
kubectl port-forward svc/grafana 3000:80 -n monitoring

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

### **View Logs**
```bash
# Application logs
kubectl logs -f deployment/apm-backend

# EKS cluster logs
aws logs describe-log-groups --log-group-name-prefix /aws/eks/apm-demo
```

## 🔒 Security Considerations

### **State Management**
- Terraform state stored in encrypted S3 buckets
- State locking with DynamoDB tables
- Separate buckets for dev/prod environments

### **Network Security**
- Private subnets for EKS nodes
- Security groups with minimal required access
- VPC endpoints for AWS services (optional)

### **IAM Roles**
- Least privilege access for EKS cluster and nodes
- ECR access for container image pulling
- CloudWatch access for logging and monitoring

## 💰 Cost Optimization

### **Development**
- SPOT instances (60-70% cost savings)
- Smaller instance types (t3.small)
- Single NAT gateway
- Basic monitoring stack
- **Estimated cost**: ~$111/month

### **Production**
- ON_DEMAND instances for reliability
- Right-sized instances (t3.medium)
- Multi-AZ NAT gateways
- Full monitoring stack
- **Estimated cost**: ~$291/month

## 🚨 Troubleshooting

### **Common Issues**

#### **AWS CLI Not Configured**
```bash
Error: AWS credentials not configured
Solution: Run 'aws configure' with valid credentials
```

#### **Terraform State Conflicts**
```bash
Error: Error acquiring the state lock
Solution: Check DynamoDB table for stuck locks, or use 'terraform force-unlock'
```

#### **EKS Node Group Creation Failed**
```bash
Error: Node group creation failed
Solution: Check IAM roles, subnet configurations, and instance limits
```

#### **kubectl Access Denied**
```bash
Error: You must be logged in to the server
Solution: Run 'aws eks update-kubeconfig --region us-east-1 --name <cluster-name>'
```

### **Debugging Commands**
```bash
# Check Terraform state
terraform state list
terraform state show <resource>

# Check AWS resources
aws eks list-clusters --region us-east-1
aws ec2 describe-instances --region us-east-1

# Check Kubernetes resources
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl get pods -A
```

## 🔄 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Deploy to EKS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to dev
        run: |
          cd terraform
          ./deploy.sh dev apply
```

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [APM Demo Application](../README.md)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudTrail logs for API errors
3. Check EKS cluster logs in CloudWatch
4. Verify IAM permissions and security groups
