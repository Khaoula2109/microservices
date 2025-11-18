#!/bin/bash

echo "📊 MONITORING DU CLUSTER"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "🔍 PODS Status:"
echo "Databases:"
kubectl get pods -n transport-databases -o wide

echo ""
echo "Microservices:"
kubectl get pods -n transport-prod -o wide

echo ""
echo "🌐 SERVICES:"
kubectl get svc -n transport-prod

echo ""
echo "📈 HPA (Horizontal Pod Autoscaler):"
kubectl get hpa -n transport-prod

echo ""
echo "💾 PERSISTENT VOLUMES:"
kubectl get pv

echo ""
echo "📦 PERSISTENT VOLUME CLAIMS:"
kubectl get pvc -n transport-databases

echo ""
echo "🌍 INGRESS:"
kubectl get ingress -n transport-prod

echo ""
echo "📊 RESOURCE USAGE:"
kubectl top nodes
kubectl top pods -n transport-prod
kubectl top pods -n transport-databases

echo ""
echo "═══════════════════════════════════════════════════════════════"
