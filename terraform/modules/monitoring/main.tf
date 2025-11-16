# Monitoring Module for APM Demo

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

# Create monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  count = var.enable_prometheus ? 1 : 0
  
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
      environment = var.environment
    }
  }
}

# Prometheus using Helm
resource "helm_release" "prometheus" {
  count = var.enable_prometheus ? 1 : 0

  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring[0].metadata[0].name
  version    = "51.2.0"

  values = [
    yamlencode({
      prometheus = {
        prometheusSpec = {
          retention = var.environment == "prod" ? "90d" : "7d"
          storageSpec = {
            volumeClaimTemplate = {
              spec = {
                storageClassName = "gp2"
                accessModes      = ["ReadWriteOnce"]
                resources = {
                  requests = {
                    storage = var.environment == "prod" ? "50Gi" : "10Gi"
                  }
                }
              }
            }
          }
        }
      }
      grafana = {
        enabled = var.enable_grafana
        adminPassword = "admin123"
        persistence = {
          enabled = true
          size = "10Gi"
        }
        service = {
          type = "ClusterIP"
        }
        ingress = {
          enabled = var.enable_grafana
          annotations = {
            "kubernetes.io/ingress.class" = "alb"
            "alb.ingress.kubernetes.io/scheme" = "internet-facing"
            "alb.ingress.kubernetes.io/target-type" = "ip"
          }
          hosts = ["grafana-${var.environment}.${var.cluster_name}.local"]
        }
      }
      alertmanager = {
        enabled = var.environment == "prod"
      }
    })
  ]

  depends_on = [kubernetes_namespace.monitoring]
}

# Tempo for distributed tracing
resource "helm_release" "tempo" {
  count = var.enable_prometheus ? 1 : 0

  name       = "tempo"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "tempo"
  namespace  = kubernetes_namespace.monitoring[0].metadata[0].name
  version    = "1.3.1"

  values = [
    yamlencode({
      tempo = {
        retention = var.environment == "prod" ? "168h" : "24h"
      }
      persistence = {
        enabled = true
        size = var.environment == "prod" ? "20Gi" : "5Gi"
      }
    })
  ]

  depends_on = [kubernetes_namespace.monitoring]
}
