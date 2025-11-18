#!/bin/bash

echo "🚀 Démarrage de Minikube..."

# Démarrer Minikube avec configuration optimale
minikube start \
  --cpus=4 \
  --memory=8192 \
  --disk-size=40g \
  --driver=docker \
  --kubernetes-version=v1.28.0

# Activer les addons
echo "📦 Activation des addons..."
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable storage-provisioner

# Vérifier le statut
echo ""
echo "✅ Statut de Minikube :"
minikube status

echo ""
echo "📊 Nodes :"
kubectl get nodes

echo ""
echo "✅ Minikube est prêt !"
