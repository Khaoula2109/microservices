#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║        🔍 DÉPLOIEMENT JAEGER TRACING SUR MINIKUBE                   ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Vérifier que Minikube est démarré
if ! minikube status &> /dev/null; then
    print_error "Minikube n'est pas démarré. Lancez ./start-minikube.sh d'abord."
    exit 1
fi
print_success "Minikube est démarré"

# 1. Créer le namespace transport-monitoring si nécessaire
echo ""
print_info "Étape 1/5: Vérification du namespace transport-monitoring..."
if ! kubectl get namespace transport-monitoring &> /dev/null; then
    kubectl create namespace transport-monitoring
    print_success "Namespace transport-monitoring créé"
else
    print_info "Namespace transport-monitoring existe déjà"
fi

# 2. Déployer Jaeger
echo ""
print_info "Étape 2/5: Déploiement de Jaeger..."
kubectl apply -f ../manifests/monitoring/jaeger.yaml

print_info "Attente du démarrage de Jaeger (30s)..."
sleep 10
kubectl wait --for=condition=ready pod -l app=jaeger -n transport-monitoring --timeout=120s || print_warning "Timeout, mais on continue..."
print_success "Jaeger déployé"

# 3. Mettre à jour les déploiements des microservices avec la variable OTEL
echo ""
print_info "Étape 3/5: Mise à jour des microservices pour le tracing..."
kubectl apply -f ../manifests/microservices/user-service.yaml
kubectl apply -f ../manifests/microservices/tickets-service.yaml
kubectl apply -f ../manifests/microservices/geolocation-service.yaml
kubectl apply -f ../manifests/microservices/api-gateway.yaml
print_success "Microservices mis à jour avec configuration tracing"

# 4. Attendre que les pods soient prêts
echo ""
print_info "Étape 4/5: Attente du redémarrage des services..."
sleep 20
print_success "Services redémarrés"

# 5. Vérification
echo ""
print_info "Étape 5/5: Vérification du déploiement..."
echo ""
echo "📊 Status Jaeger:"
kubectl get pods -n transport-monitoring -l app=jaeger
echo ""
echo "📊 Status Microservices:"
kubectl get pods -n transport-prod | grep -E "(user-service|tickets-service|geolocation-service|api-gateway)" || true

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ JAEGER TRACING DÉPLOYÉ !                         ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Pour accéder à l'interface Jaeger:"
echo ""
echo "   Option 1 - Via minikube service (recommandé):"
echo "   $ minikube service jaeger-ui -n transport-monitoring"
echo ""
echo "   Option 2 - Via port-forward:"
echo "   $ kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686"
echo "   puis ouvrez: http://localhost:16686"
echo ""
echo "   Option 3 - Via NodePort:"
echo "   $ minikube ip"
echo "   puis ouvrez: http://<MINIKUBE_IP>:30686"
echo ""
echo "🧪 Pour tester le tracing:"
echo "   1. Générez du trafic sur votre application"
echo "   2. Ouvrez l'interface Jaeger"
echo "   3. Sélectionnez un service (user-service, api-gateway, etc.)"
echo "   4. Cliquez sur 'Find Traces' pour voir les traces"
echo ""
echo "📚 Documentation complète: ../JAEGER_TRACING_GUIDE.md"
echo ""
print_success "Jaeger est maintenant opérationnel! 🎉"
