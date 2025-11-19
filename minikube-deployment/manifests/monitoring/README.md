# Monitoring Stack for KowihanTransit

This directory contains Kubernetes manifests for deploying Prometheus and Grafana monitoring stack.

## Components

- **Prometheus** - Metrics collection and storage
- **Grafana** - Metrics visualization and dashboards

## Deployment

Deploy the monitoring stack with:

```bash
# Deploy Prometheus
kubectl apply -f prometheus.yaml

# Deploy Grafana
kubectl apply -f grafana.yaml
```

## Access

### Via Ingress (recommended)

Add entries to your `/etc/hosts`:
```bash
echo "$(minikube ip) prometheus.kowihan.local grafana.kowihan.local" | sudo tee -a /etc/hosts
```

- **Prometheus**: `http://prometheus.kowihan.local`
- **Grafana**: `http://grafana.kowihan.local`
  - **Username**: `admin`
  - **Password**: `admin123`

### Via Port-Forward (alternative)
```bash
kubectl port-forward svc/prometheus 9090:9090 -n transport-prod
kubectl port-forward svc/grafana 3000:3000 -n transport-prod
```
Then access at `http://localhost:9090` and `http://localhost:3000`

## Metrics Endpoints

Each Spring Boot service exposes metrics at `/actuator/prometheus`:

- API Gateway: `http://api-gateway:8081/actuator/prometheus`
- User Service: `http://user-service:8080/actuator/prometheus`
- Tickets Service: `http://tickets-service:8082/actuator/prometheus`
- Routes Service: `http://routes-service:8083/actuator/prometheus`

## Configuration

### Prometheus
The Prometheus configuration uses Kubernetes service discovery to automatically find pods with the appropriate labels.

### Grafana
Grafana is pre-configured with:
- Prometheus as default datasource
- Dashboard provider for automatic dashboard loading

## Troubleshooting

Check if Prometheus can scrape targets:
```bash
kubectl port-forward svc/prometheus 9090:9090 -n transport-prod
# Then visit http://localhost:9090/targets
```

Check Grafana logs:
```bash
kubectl logs -l app=grafana -n transport-prod
```
