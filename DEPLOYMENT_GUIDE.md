# 🚀 EKS Deployment Guide for APM Demo

## 📋 Complete Deployment Checklist

### **Prerequisites ✅**
- [x] AWS CLI configured with valid credentials
- [x] Terraform >= 1.0 installed
- [x] kubectl installed
- [x] Docker installed

### **⚠️ IMPORTANT: Security First**
**Before proceeding, ensure you have rotated the AWS credentials that were shared earlier!**

1. Go to AWS Console → IAM → Users → Your User → Security Credentials
2. Delete the compromised access key: `AKIAT7HB6RVNR26SFKOY`
3. Create new access keys
4. Update your AWS CLI configuration

## 🚀 Step-by-Step Deployment

### **Step 1: Verify AWS Configuration**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Expected output should show your account ID: 273204284763
{
    "UserId": "AIDAT7HB6RVN...",
    "Account": "273204284763",
    "Arn": "arn:aws:iam::273204284763:user/tuan.dang@etana.com"
}
```

### **Step 2: Deploy Development Environment**
```bash
# Navigate to terraform directory
cd terraform

# Deploy dev infrastructure (this will take 15-20 minutes)
./deploy.sh dev apply

# Expected output:
# ✅ S3 bucket created for state management
# ✅ DynamoDB table created for state locking
# ✅ VPC and subnets created
# ✅ EKS cluster created: apm-demo-dev-east
# ✅ ECR repository created
# ✅ kubectl configured automatically
```

### **Step 3: Verify Development Deployment**
```bash
# Check EKS cluster
kubectl get nodes
# Should show 2 t3.small nodes

# Check cluster info
kubectl cluster-info
# Should show cluster endpoint

# Get ECR repository URL
cd environments/dev
terraform output ecr_repository_url
# Output: 273204284763.dkr.ecr.us-east-1.amazonaws.com/apm-backend
```

### **Step 4: Build and Push Container Image**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 273204284763.dkr.ecr.us-east-1.amazonaws.com

# Build the image
cd ../../  # Back to project root
docker build -t apm-backend:dev -f k8s/Dockerfile backend/

# Tag for ECR
docker tag apm-backend:dev 273204284763.dkr.ecr.us-east-1.amazonaws.com/apm-backend:dev

# Push to ECR
docker push 273204284763.dkr.ecr.us-east-1.amazonaws.com/apm-backend:dev
```

### **Step 5: Deploy Application to Development**
```bash
# Install AWS Load Balancer Controller (required for ingress)
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"

# Deploy application using Kustomize
kubectl apply -k k8s-manifests/dev/

# Check deployment
kubectl get pods
kubectl get svc
kubectl get ingress
```

### **Step 6: Test Development Application**
```bash
# Get load balancer URL
kubectl get ingress apm-backend-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test the application
curl http://<load-balancer-url>/health
curl "http://<load-balancer-url>/chat?name=DevTest"
```

### **Step 7: Deploy Production Environment**
```bash
# Deploy prod infrastructure
cd terraform
./deploy.sh prod apply

# Build production image
docker build -t apm-backend:v1.0.0 -f k8s/Dockerfile backend/
docker tag apm-backend:v1.0.0 273204284763.dkr.ecr.us-east-1.amazonaws.com/apm-backend:v1.0.0
docker push 273204284763.dkr.ecr.us-east-1.amazonaws.com/apm-backend:v1.0.0

# Switch kubectl context to prod
aws eks update-kubeconfig --region us-east-1 --name apm-demo-prod-east

# Deploy to production
kubectl apply -k k8s-manifests/prod/
```

## 📊 Environment Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **Cluster Name** | apm-demo-dev-east | apm-demo-prod-east |
| **VPC CIDR** | 10.0.0.0/16 | 10.1.0.0/16 |
| **Instance Type** | t3.small | t3.medium |
| **Capacity Type** | SPOT (cost savings) | ON_DEMAND (reliability) |
| **Node Count** | 1-3 (desired: 2) | 3-10 (desired: 5) |
| **App Replicas** | 2 | 5 |
| **Auto-scaling** | Disabled | Enabled |
| **Monitoring** | Basic Prometheus | Full Prometheus + Grafana |
| **Monthly Cost** | ~$111 | ~$291 |

## 🔍 Monitoring & Observability

### **Access Grafana (Production Only)**
```bash
# Port forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Access at: http://localhost:3000
# Username: admin
# Password: admin123
```

### **View Application Logs**
```bash
# Application logs
kubectl logs -f deployment/apm-backend

# All pods logs
kubectl logs -f -l app=apm-backend
```

### **Monitor Resource Usage**
```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods
```

## 🧪 Load Testing

### **Run K6 Tests Against EKS**
```bash
# Get load balancer URL
export LB_URL=$(kubectl get ingress apm-backend-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Update K6 test files to use EKS endpoint
sed -i "s/localhost:8051/$LB_URL/g" k6-tests/*.js

# Run load tests
./k6-tests/run-tests.sh
```

## 🔧 Troubleshooting

### **Common Issues**

#### **1. EKS Cluster Creation Failed**
```bash
# Check CloudTrail logs
aws logs describe-log-groups --log-group-name-prefix /aws/eks

# Common causes:
# - Insufficient IAM permissions
# - VPC/subnet configuration issues
# - Service limits exceeded
```

#### **2. Pods Not Starting**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Common causes:
# - Image pull errors (ECR permissions)
# - Resource constraints
# - Health check failures
```

#### **3. Load Balancer Not Created**
```bash
# Check AWS Load Balancer Controller
kubectl get pods -n kube-system | grep aws-load-balancer

# Install if missing:
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"
```

#### **4. Application Not Accessible**
```bash
# Check ingress status
kubectl describe ingress apm-backend-ingress

# Check security groups allow HTTP/HTTPS traffic
aws ec2 describe-security-groups --group-ids <sg-id>
```

## 💰 Cost Management

### **Monitor Costs**
```bash
# Check EC2 instances
aws ec2 describe-instances --region us-east-1 --query 'Reservations[].Instances[?State.Name==`running`].[InstanceId,InstanceType,State.Name]' --output table

# Check EKS cluster costs in AWS Cost Explorer
# Filter by: Service = Amazon Elastic Kubernetes Service
```

### **Cost Optimization Tips**
- **Development**: Use SPOT instances (already configured)
- **Production**: Consider Reserved Instances for predictable workloads
- **Monitoring**: Set up billing alerts in AWS
- **Cleanup**: Destroy dev environment when not in use

## 🔄 Environment Management

### **Switch Between Environments**
```bash
# Switch to dev
aws eks update-kubeconfig --region us-east-1 --name apm-demo-dev-east

# Switch to prod
aws eks update-kubeconfig --region us-east-1 --name apm-demo-prod-east

# Check current context
kubectl config current-context
```

### **Cleanup Resources**
```bash
# Destroy development environment
cd terraform
./deploy.sh dev destroy

# Destroy production environment
./deploy.sh prod destroy
```

## 📚 Next Steps

1. **SSL/TLS**: Add ACM certificate for HTTPS
2. **DNS**: Configure Route53 for custom domain
3. **CI/CD**: Set up GitHub Actions for automated deployments
4. **Security**: Implement Pod Security Standards
5. **Backup**: Configure EBS snapshots for persistent volumes
6. **Scaling**: Fine-tune HPA and cluster autoscaler settings

## 🆘 Support

For issues:
1. Check this troubleshooting guide
2. Review AWS CloudTrail logs
3. Check EKS cluster logs in CloudWatch
4. Verify IAM permissions and security groups

**Your EKS deployment is now ready! 🎉**
