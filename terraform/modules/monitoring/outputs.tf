# Monitoring Module Outputs

output "monitoring_namespace" {
  description = "Name of the monitoring namespace"
  value       = var.enable_prometheus ? kubernetes_namespace.monitoring[0].metadata[0].name : null
}

output "prometheus_service" {
  description = "Prometheus service name"
  value       = var.enable_prometheus ? "${helm_release.prometheus[0].name}-kube-prometheus-prometheus" : null
}

output "grafana_service" {
  description = "Grafana service name"
  value       = var.enable_grafana ? "${helm_release.prometheus[0].name}-grafana" : null
}

output "tempo_service" {
  description = "Tempo service name"
  value       = var.enable_prometheus ? helm_release.tempo[0].name : null
}
