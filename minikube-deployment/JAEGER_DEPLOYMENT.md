# 🔍 Déploiement Jaeger sur Minikube

## 📋 Prérequis

- Minikube démarré (`./start-minikube.sh`)
- Tous les microservices déployés (`./deploy-all.sh`)

## 🚀 Déploiement Rapide

### Option 1: Script automatique (recommandé)

```bash
cd minikube-deployment/scripts
./deploy-jaeger.sh
```

Ce script va automatiquement:
1. ✅ Créer le namespace `transport-monitoring`
2. ✅ Déployer Jaeger all-in-one
3. ✅ Mettre à jour les microservices avec configuration tracing
4. ✅ Redémarrer les services
5. ✅ Vérifier le déploiement

### Option 2: Déploiement manuel

```bash
# 1. Créer le namespace
kubectl create namespace transport-monitoring

# 2. Déployer Jaeger
kubectl apply -f manifests/monitoring/jaeger.yaml

# 3. Mettre à jour les microservices
kubectl apply -f manifests/microservices/user-service.yaml
kubectl apply -f manifests/microservices/tickets-service.yaml
kubectl apply -f manifests/microservices/geolocation-service.yaml
kubectl apply -f manifests/microservices/api-gateway.yaml

# 4. Vérifier
kubectl get pods -n transport-monitoring
```

## 🌐 Accéder à l'interface Jaeger

### Méthode 1: Via minikube service (la plus simple)

```bash
minikube service jaeger-ui -n transport-monitoring
```

Cette commande va:
- Créer un tunnel automatique
- Ouvrir votre navigateur sur l'interface Jaeger

### Méthode 2: Via NodePort

```bash
# Obtenir l'IP de minikube
minikube ip

# Ouvrir dans le navigateur
# http://<MINIKUBE_IP>:30686
```

Exemple: `http://192.168.49.2:30686`

### Méthode 3: Via port-forward

```bash
kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686
```

Puis ouvrez: `http://localhost:16686`

## 🧪 Tester le Tracing

### 1. Générer du trafic

Utilisez votre application normalement:
- Connectez-vous
- Achetez des tickets
- Consultez la carte des bus
- Vérifiez votre programme fidélité

### 2. Voir les traces dans Jaeger

1. Ouvrez l'interface Jaeger
2. Dans le menu **Service**, sélectionnez un service:
   - `api-gateway` - Pour voir les requêtes qui passent par la gateway
   - `user-service` - Pour voir les opérations utilisateur
   - `tickets-service` - Pour voir les achats de tickets
   - `geolocation-service` - Pour voir les requêtes de position

3. Cliquez sur **Find Traces**

4. Explorez une trace pour voir:
   - **Duration**: Temps total de la requête
   - **Spans**: Toutes les étapes (HTTP, DB, etc.)
   - **Tags**: Informations (HTTP method, status, SQL queries)

## 📊 Services Instrumentés

### Java/Spring Boot Services

Les services suivants envoient automatiquement des traces:

**user-service:**
- Requêtes HTTP (endpoints REST)
- Requêtes PostgreSQL
- Opérations Spring Data JPA

**tickets-service:**
- Requêtes HTTP (endpoints REST)
- Requêtes MySQL
- Génération de QR codes

**api-gateway:**
- Routing des requêtes
- WebFlux operations
- Circuit breaker

### Python/Flask Service

**geolocation-service:**
- Endpoints Flask
- Opérations Redis

## 🔧 Configuration

### Variables d'environnement ajoutées

**Services Java** (user-service, tickets-service, api-gateway):
```yaml
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: "http://jaeger.transport-monitoring.svc.cluster.local:4318"
```

**Service Python** (geolocation-service):
```yaml
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: "http://jaeger.transport-monitoring.svc.cluster.local:4318/v1/traces"
```

### Fichiers modifiés

```
minikube-deployment/
├── manifests/
│   ├── monitoring/
│   │   └── jaeger.yaml                    # ✨ NOUVEAU
│   └── microservices/
│       ├── user-service.yaml              # ✏️ MODIFIÉ (+ OTEL env var)
│       ├── tickets-service.yaml           # ✏️ MODIFIÉ (+ OTEL env var)
│       ├── geolocation-service.yaml       # ✏️ MODIFIÉ (+ OTEL env var)
│       └── api-gateway.yaml               # ✏️ MODIFIÉ (+ OTEL env var)
└── scripts/
    └── deploy-jaeger.sh                   # ✨ NOUVEAU
```

## 🐛 Dépannage

### Jaeger pod ne démarre pas

```bash
# Vérifier les logs
kubectl logs -n transport-monitoring -l app=jaeger

# Vérifier les événements
kubectl get events -n transport-monitoring --sort-by='.lastTimestamp'
```

### Services ne reçoivent pas de traces

```bash
# Vérifier que les variables d'environnement sont bien définies
kubectl describe pod -n transport-prod -l app=user-service | grep OTEL

# Vérifier les logs d'un service
kubectl logs -n transport-prod -l app=user-service | grep -i "otel\|telemetry"

# Tester la connectivité vers Jaeger
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://jaeger.transport-monitoring.svc.cluster.local:4318/v1/traces
```

### Interface Jaeger inaccessible

```bash
# Vérifier le service Jaeger
kubectl get svc -n transport-monitoring

# Vérifier le pod Jaeger
kubectl get pods -n transport-monitoring

# Essayer avec port-forward au lieu de NodePort
kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686
```

### Aucune trace visible dans Jaeger

1. **Vérifier que les services ont redémarré:**
   ```bash
   kubectl get pods -n transport-prod
   ```

2. **Générer du trafic:**
   - Faites des requêtes sur l'application
   - Attendez 10-20 secondes

3. **Rafraîchir l'interface Jaeger:**
   - Changez la période de recherche (Last hour, Last day)
   - Essayez un autre service

## 📚 Ressources

- **Guide complet:** `../JAEGER_TRACING_GUIDE.md`
- **Documentation Jaeger:** https://www.jaegertracing.io/docs/
- **OpenTelemetry:** https://opentelemetry.io/

## ✅ Checklist de Vérification

- [ ] Minikube démarré
- [ ] Namespace `transport-monitoring` créé
- [ ] Pod Jaeger en état `Running`
- [ ] Services mis à jour avec env var OTEL
- [ ] Interface Jaeger accessible
- [ ] Traces visibles après génération de trafic

---

**Bon tracing! 🔍🎉**
