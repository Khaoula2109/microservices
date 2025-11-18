#!/bin/bash

echo "🌐 Configuration de l'accès à l'application..."
echo ""

# Démarrer le tunnel Minikube en arrière-plan
echo "📡 Démarrage du tunnel Minikube..."
minikube tunnel > /dev/null 2>&1 &
TUNNEL_PID=$!

echo "✅ Tunnel démarré (PID: $TUNNEL_PID)"
echo ""

# Attendre un peu
sleep 5

# Récupérer l'IP de Minikube
MINIKUBE_IP=$(minikube ip)

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                  🌐 URLS D'ACCÈS                                     ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Frontend:       http://$MINIKUBE_IP"
echo "API Gateway:    http://$MINIKUBE_IP/api"
echo ""
echo "RabbitMQ Management:"
echo "  Port-forward: kubectl port-forward -n transport-databases svc/rabbitmq 15672:15672"
echo "  Then open:    http://localhost:15672 (user/password123456)"
echo ""
echo "Kubernetes Dashboard:"
echo "  minikube dashboard"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  Pour arrêter le tunnel: kill $TUNNEL_PID                            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Garder le script actif
echo "⏳ Tunnel actif. Appuyez sur Ctrl+C pour arrêter..."
wait $TUNNEL_PID
