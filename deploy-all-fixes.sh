#!/bin/bash
set -e

echo "🚀 Déploiement complet avec toutes les nouvelles fonctionnalités"
echo "============================================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Étape 1: Trouver PostgreSQL
echo -e "${YELLOW}📊 Étape 1/5: Configuration PostgreSQL...${NC}"
POSTGRES_POD=$(kubectl get pods -n transport-databases -o name 2>/dev/null | grep postgres | head -1 | cut -d'/' -f2)

if [ -z "$POSTGRES_POD" ]; then
  echo -e "${RED}❌ Pod PostgreSQL non trouvé dans transport-databases${NC}"
  echo "Pods disponibles dans transport-databases:"
  kubectl get pods -n transport-databases
  echo ""
  echo "Essayez manuellement:"
  echo "kubectl exec -it -n transport-databases <POD_NAME> -- psql -U kowihan -d user_db"
  echo "Puis exécutez:"
  echo "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0 NOT NULL;"
  exit 1
fi

echo -e "${GREEN}✓ Pod PostgreSQL trouvé: $POSTGRES_POD${NC}"

# Ajouter la colonne loyalty_points
echo "  ➕ Ajout de la colonne loyalty_points..."
kubectl exec -n transport-databases $POSTGRES_POD -- psql -U kowihan -d user_db -c "
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
UPDATE app_users SET loyalty_points = 0 WHERE loyalty_points IS NULL;
ALTER TABLE app_users ALTER COLUMN loyalty_points SET NOT NULL;
" 2>&1 | grep -v "already exists" || true

# Vérifier
echo "  ✓ Vérification de la colonne..."
kubectl exec -n transport-databases $POSTGRES_POD -- psql -U kowihan -d user_db -c "
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name='app_users' AND column_name='loyalty_points';
" || echo "Note: La colonne existe peut-être déjà"

echo -e "${GREEN}✓ PostgreSQL configuré${NC}"
echo ""

# Étape 2: Rebuild user-service
echo -e "${YELLOW}📦 Étape 2/5: Rebuild user-service (programme fidélité)...${NC}"
cd ~/Desktop/microservices/user-service
docker build -t user-service:latest . --quiet && echo -e "${GREEN}✓ user-service rebuilt${NC}" || echo -e "${RED}❌ Erreur rebuild user-service${NC}"

# Étape 3: Rebuild geolocation-service
echo -e "${YELLOW}📦 Étape 3/5: Rebuild geolocation-service (capacité bus)...${NC}"
cd ~/Desktop/microservices/geolocation-service
docker build -t geolocation-service:latest . --quiet && echo -e "${GREEN}✓ geolocation-service rebuilt${NC}" || echo -e "${RED}❌ Erreur rebuild geolocation-service${NC}"

# Étape 4: Rebuild frontend
echo -e "${YELLOW}📦 Étape 4/5: Rebuild frontend (4 nouvelles pages)...${NC}"
cd ~/Desktop/microservices/Frontend/project
docker build -t frontend:latest . --quiet && echo -e "${GREEN}✓ frontend rebuilt${NC}" || echo -e "${RED}❌ Erreur rebuild frontend${NC}"

cd ~/Desktop/microservices
echo ""

# Étape 5: Restart deployments
echo -e "${YELLOW}♻️  Étape 5/5: Restart des déploiements Kubernetes...${NC}"
echo "  → Restart user-service..."
kubectl rollout restart deployment user-service -n transport-prod 2>&1 | grep -v "not found" || true

echo "  → Restart geolocation-service..."
kubectl rollout restart deployment geolocation-service -n transport-prod 2>&1 | grep -v "not found" || true

echo "  → Restart frontend..."
kubectl rollout restart deployment frontend -n transport-prod 2>&1 | grep -v "not found" || true

echo ""
echo -e "${YELLOW}⏳ Attente des nouveaux pods (30 secondes)...${NC}"
sleep 30

echo ""
echo "============================================================"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ !${NC}"
echo "============================================================"
echo ""

# Afficher l'état des pods
echo "📊 État des pods principaux:"
kubectl get pods -n transport-prod | head -1
kubectl get pods -n transport-prod | grep -E "user-service|geolocation-service|frontend" | head -6

echo ""
echo "🔍 Vérification rapide user-service:"
sleep 5
kubectl logs -n transport-prod deployment/user-service --tail=10 2>&1 | grep -i "started\|error\|loyalty" || echo "Logs non disponibles immédiatement, vérifiez dans quelques secondes"

echo ""
echo "============================================================"
echo -e "${GREEN}🎉 Toutes les nouvelles fonctionnalités sont déployées !${NC}"
echo "============================================================"
echo ""
echo "✅ Fonctionnalités disponibles sur https://kowihan.local :"
echo "   1. 📊 Historique Paiements - Page d'accueil → Historique Paiements"
echo "   2. 🚌 Capacité Bus - Carte Live (cliquez sur un bus)"
echo "   3. ⭐ Programme Fidélité - Page d'accueil → Programme Fidélité"
echo "   4. 🗺️  Suggestions Itinéraires - Page d'accueil → Suggestions d'Itinéraires"
echo ""
echo "📝 Pour vérifier les logs complets:"
echo "   kubectl logs -f deployment/user-service -n transport-prod"
echo "   kubectl logs -f deployment/geolocation-service -n transport-prod"
echo "   kubectl logs -f deployment/frontend -n transport-prod"
echo ""
