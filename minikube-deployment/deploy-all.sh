#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║        🚀 DÉPLOIEMENT COMPLET SUR MINIKUBE                          ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que Minikube est démarré
if ! minikube status &> /dev/null; then
    echo "❌ Minikube n'est pas démarré. Lancez ./start-minikube.sh d'abord."
    exit 1
fi

echo "📦 1/6 - Création des namespaces..."
kubectl apply -f manifests/00-namespaces.yaml

echo "🔐 2/6 - Configuration des secrets et configmaps..."
kubectl apply -f manifests/01-secrets.yaml

echo "🗄️ 3/6 - Déploiement des bases de données..."
kubectl apply -f manifests/databases/

echo "⏳ Attente du démarrage des bases de données (120s)..."
sleep 120

echo "🚀 4/6 - Déploiement des microservices..."
kubectl apply -f manifests/microservices/

echo "⏳ Attente du démarrage des microservices (60s)..."
sleep 60

echo "🌐 5/6 - Configuration de l'Ingress..."
kubectl apply -f manifests/ingress/

echo "✅ 6/6 - Vérification du déploiement..."
echo ""
echo "📊 PODS dans transport-databases:"
kubectl get pods -n transport-databases

echo ""
echo "📊 PODS dans transport-prod:"
kubectl get pods -n transport-prod

echo ""
echo "🌐 SERVICES:"
kubectl get svc -n transport-prod

echo ""
echo "🌍 INGRESS:"
kubectl get ingress -n transport-prod

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ DÉPLOIEMENT TERMINÉ !                            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Pour accéder à l'application :"
echo "   minikube tunnel"
echo "   puis ouvrez: http://$(minikube ip)"
echo ""
echo "📊 Dashboard Kubernetes :"
echo "   minikube dashboard"
echo ""
