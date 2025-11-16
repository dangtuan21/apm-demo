#!/bin/bash

# APM Demo EKS Deployment Script
# Usage: ./deploy.sh [dev|prod] [plan|apply|destroy]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Validate input parameters
validate_inputs() {
    if [ $# -ne 2 ]; then
        print_error "Usage: $0 [dev|prod] [plan|apply|destroy]"
        exit 1
    fi
    
    ENVIRONMENT=$1
    ACTION=$2
    
    if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
        print_error "Environment must be 'dev' or 'prod'"
        exit 1
    fi
    
    if [[ ! "$ACTION" =~ ^(plan|apply|destroy)$ ]]; then
        print_error "Action must be 'plan', 'apply', or 'destroy'"
        exit 1
    fi
}

# Create S3 bucket for state management
setup_backend() {
    local env=$1
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local bucket_name="apm-demo-terraform-state-${env}-${account_id}"
    
    print_status "Setting up Terraform backend for ${env} environment..."
    
    # Create S3 bucket if it doesn't exist
    if ! aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
        print_status "Creating S3 bucket: $bucket_name"
        aws s3api create-bucket --bucket "$bucket_name" --region us-east-1
        aws s3api put-bucket-versioning --bucket "$bucket_name" --versioning-configuration Status=Enabled
        aws s3api put-bucket-encryption --bucket "$bucket_name" --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
        print_success "S3 bucket created: $bucket_name"
    else
        print_status "S3 bucket already exists: $bucket_name"
    fi
}

# Deploy infrastructure
deploy_infrastructure() {
    local env=$1
    local action=$2
    
    print_status "Deploying $env environment with action: $action"
    
    cd "environments/$env"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Run the specified action
    case $action in
        plan)
            print_status "Running Terraform plan..."
            terraform plan -var-file="terraform.tfvars"
            ;;
        apply)
            print_status "Running Terraform apply..."
            terraform apply -var-file="terraform.tfvars" -auto-approve
            
            # Configure kubectl
            print_status "Configuring kubectl..."
            CLUSTER_NAME=$(terraform output -raw cluster_name)
            aws eks update-kubeconfig --region us-east-1 --name "$CLUSTER_NAME"
            
            print_success "Infrastructure deployed successfully!"
            print_status "Cluster name: $CLUSTER_NAME"
            print_status "ECR repository: $(terraform output -raw ecr_repository_url)"
            ;;
        destroy)
            print_warning "This will destroy all infrastructure in the $env environment!"
            read -p "Are you sure? Type 'yes' to confirm: " confirm
            if [ "$confirm" = "yes" ]; then
                print_status "Running Terraform destroy..."
                terraform destroy -var-file="terraform.tfvars" -auto-approve
                print_success "Infrastructure destroyed successfully!"
            else
                print_status "Destroy cancelled."
            fi
            ;;
    esac
    
    cd - > /dev/null
}

# Main function
main() {
    print_status "APM Demo EKS Deployment Script"
    print_status "================================"
    
    validate_inputs "$@"
    check_prerequisites
    setup_backend "$ENVIRONMENT"
    deploy_infrastructure "$ENVIRONMENT" "$ACTION"
    
    print_success "Deployment script completed!"
}

# Run main function with all arguments
main "$@"
