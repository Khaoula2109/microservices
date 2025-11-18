#!/bin/bash

echo "⚠️  ATTENTION : Cela va supprimer TOUTE l'application !"
echo ""
read -p "Êtes-vous sûr ? (yes/no) : " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Annulé."
    exit 0
fi

echo "🗑️  Suppression de l'application..."

kubectl delete -f manifests/ingress/ 2>/dev/null
kubectl delete -f manifests/microservices/ 2>/dev/null
kubectl delete -f manifests/databases/ 2>/dev/null
kubectl delete -f manifests/01-secrets.yaml 2>/dev/null
kubectl delete -f manifests/00-namespaces.yaml 2>/dev/null

echo ""
echo "✅ Application supprimée !"
echo ""
echo "Pour supprimer complètement Minikube :"
echo "  minikube delete"
