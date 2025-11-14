#!/bin/bash

echo "🚀 Setting up APM Backend on Kubernetes"

# Check if minikube is running
if ! minikube status | grep -q "Running"; then
    echo "❌ Minikube is not running. Please start it first:"
    echo "   minikube start --cpus=4 --memory=8192"
    exit 1
fi

# Set docker environment to minikube
echo "📦 Setting Docker environment to minikube..."
eval $(minikube docker-env)

# Build the Docker image inside minikube
echo "🔨 Building Docker image..."
docker build -t apm-backend:local -f k8s/Dockerfile .

# Apply Kubernetes manifests
echo "🚢 Deploying to Kubernetes..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/prometheus-k8s.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/apm-backend
kubectl wait --for=condition=available --timeout=300s deployment/prometheus

# Get service URLs
echo "🌐 Getting service URLs..."
echo ""
echo "📊 Backend Service:"
minikube service apm-backend-loadbalancer --url
echo ""
echo "📈 Prometheus Service:"
minikube service prometheus-service --url
echo ""

# Show pod status
echo "📋 Pod Status:"
kubectl get pods -l app=apm-backend
echo ""

# Show HPA status
echo "📊 HPA Status:"
kubectl get hpa
echo ""

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Test the backend: curl \$(minikube service apm-backend-loadbalancer --url)/health"
echo "2. Run load tests: k6 run load-tests/stress-test.js"
echo "3. Watch auto-scaling: kubectl get hpa -w"
echo "4. Monitor pods: kubectl get pods -w"
