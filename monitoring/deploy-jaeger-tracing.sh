#!/bin/bash

# Script de déploiement pour Jaeger Distributed Tracing
# Auteur: Claude AI
# Date: 2025-11-28

set -e

echo "🔍 =========================================="
echo "🔍  Déploiement Jaeger Distributed Tracing"
echo "🔍 =========================================="
echo ""

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
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

# 1. Déployer Jaeger sur Kubernetes
echo ""
print_info "Étape 1/5: Déploiement de Jaeger sur Kubernetes..."

# Determine the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$SCRIPT_DIR/jaeger-deployment.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/jaeger-deployment.yaml"
    print_success "Jaeger déployé avec succès"
else
    print_error "Fichier jaeger-deployment.yaml introuvable!"
    exit 1
fi

# 2. Attendre que Jaeger soit prêt
echo ""
print_info "Étape 2/5: Attente du démarrage de Jaeger..."
sleep 5

kubectl wait --for=condition=ready pod -l app=jaeger -n transport-monitoring --timeout=120s
if [ $? -eq 0 ]; then
    print_success "Jaeger est prêt"
else
    print_warning "Timeout en attendant Jaeger, mais on continue..."
fi

# 3. Rebuild des images Docker avec les nouvelles dépendances
echo ""
print_info "Étape 3/5: Rebuild des images Docker avec support tracing..."

services=("user-service" "tickets-service" "geolocation-service" "apigateway")

for service in "${services[@]}"; do
    if [ -d "$PROJECT_ROOT/$service" ]; then
        print_info "Building $service..."
        cd "$PROJECT_ROOT/$service"
        docker build -t "$service:latest" . > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "$service image rebuilt"
        else
            print_error "Échec du build de $service"
            exit 1
        fi
    else
        print_warning "Service $service non trouvé, skip..."
    fi
done

# Return to script directory
cd "$SCRIPT_DIR"

# 4. Redéployer les services
echo ""
print_info "Étape 4/5: Redéploiement des services..."

deployments=("user-service" "tickets-service" "geolocation-service" "api-gateway")

for deployment in "${deployments[@]}"; do
    print_info "Redéploiement de $deployment..."
    kubectl rollout restart deployment "$deployment" -n transport-prod 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "$deployment redémarré"
    else
        print_warning "$deployment n'existe pas ou erreur, skip..."
    fi
done

# 5. Vérification
echo ""
print_info "Étape 5/5: Vérification du déploiement..."

# Vérifier Jaeger
echo ""
print_info "Status Jaeger:"
kubectl get pods -n transport-monitoring

# Vérifier les services
echo ""
print_info "Status services (transport-prod):"
kubectl get pods -n transport-prod | grep -E "(user-service|tickets-service|geolocation-service|api-gateway)" || true

# Afficher les instructions d'accès
echo ""
echo "=========================================="
print_success "✅ Déploiement terminé!"
echo "=========================================="
echo ""
echo "📊 Interface Jaeger UI:"
echo "   - Via NodePort: http://localhost:30686"
echo "   - Via port-forward: kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686"
echo "                       puis http://localhost:16686"
echo ""
echo "🔍 Pour vérifier les traces:"
echo "   1. Générez du trafic sur vos services"
echo "   2. Ouvrez l'interface Jaeger"
echo "   3. Sélectionnez un service (ex: user-service, api-gateway)"
echo "   4. Cliquez sur 'Find Traces'"
echo ""
echo "📚 Documentation complète: JAEGER_TRACING_GUIDE.md"
echo ""
echo "🧪 Tester rapidement:"
echo "   # Générer une trace"
echo "   curl -H \"Authorization: Bearer <TOKEN>\" http://kowihan.local/api/users/me"
echo ""
echo "   # Voir les logs OpenTelemetry"
echo "   kubectl logs -f deployment/user-service -n transport-prod | grep -i otel"
echo ""
print_success "Jaeger est maintenant opérationnel! 🎉"
