# 🔍 Guide Jaeger Distributed Tracing

## 📋 Vue d'ensemble

Jaeger est un système de traçage distribué open-source développé par Uber. Il permet de suivre les requêtes à travers les différents microservices pour :
- 🐛 **Déboguer** les problèmes de performance
- 📊 **Analyser** les dépendances entre services
- 🔎 **Identifier** les goulots d'étranglement
- 📈 **Visualiser** le flux des requêtes

## 🏗️ Architecture

### Services instrumentés avec OpenTelemetry

1. **user-service** (Java/Spring Boot)
   - Traces HTTP endpoints
   - Traces requêtes base de données (PostgreSQL)
   - Traces Spring Data operations

2. **tickets-service** (Java/Spring Boot)
   - Traces HTTP endpoints
   - Traces requêtes base de données (MySQL)
   - Traces Spring Data operations
   - Traces génération QR codes

3. **geolocation-service** (Python/Flask)
   - Traces HTTP endpoints Flask
   - Traces opérations Redis

## 🚀 Déploiement

### 1. Déployer Jaeger sur Kubernetes

```bash
# Déployer Jaeger dans le namespace transport-monitoring
kubectl apply -f k8s/jaeger-deployment.yaml

# Vérifier le déploiement
kubectl get pods -n transport-monitoring
kubectl get svc -n transport-monitoring
```

### 2. Accéder à l'interface Jaeger

L'interface web Jaeger est accessible via NodePort sur le port 30686 :

```bash
# Via NodePort
http://localhost:30686

# Ou via port-forward
kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686
# Puis ouvrir http://localhost:16686
```

### 3. Redéployer les services avec tracing

```bash
# Rebuild des images Docker avec les nouvelles dépendances
cd user-service
docker build -t user-service:latest .

cd ../tickets-service
docker build -t tickets-service:latest .

cd ../geolocation-service
docker build -t geolocation-service:latest .

# Redémarrer les déploiements
kubectl rollout restart deployment user-service -n transport-prod
kubectl rollout restart deployment tickets-service -n transport-prod
kubectl rollout restart deployment geolocation-service -n transport-prod

# Vérifier les logs pour confirmer la connexion à Jaeger
kubectl logs -f deployment/user-service -n transport-prod | grep -i otel
```

## 📊 Utilisation de l'interface Jaeger

### 1. Rechercher des traces

1. Accéder à http://localhost:30686
2. Sélectionner un service dans le menu déroulant (ex: "user-service")
3. Cliquer sur "Find Traces"
4. Explorer les traces pour voir :
   - **Durée totale** de la requête
   - **Nombre de spans** (étapes)
   - **Services impliqués**

### 2. Analyser une trace

Cliquer sur une trace pour voir :
- **Timeline** : Visualisation chronologique des opérations
- **Spans** : Chaque étape de la requête (HTTP, DB, etc.)
- **Tags** : Métadonnées (méthode HTTP, statut, etc.)
- **Logs** : Événements détaillés dans chaque span

### 3. Cas d'usage courants

#### Déboguer une requête lente

```
1. Chercher les traces du service concerné
2. Filtrer par durée > 1s
3. Identifier le span le plus long
4. Analyser les tags et logs pour comprendre le problème
```

#### Tracer un achat de ticket complet

Exemple de flux tracé :
```
Frontend → API Gateway → user-service → PostgreSQL
                      ↓
                   tickets-service → MySQL
                      ↓
                   RabbitMQ → notification-service
```

Chaque étape sera visible dans Jaeger avec :
- Durée précise
- Paramètres de la requête
- Erreurs éventuelles

## 🔧 Configuration avancée

### Variables d'environnement

Pour tous les services Java (user-service, tickets-service) :

```properties
# application.properties
otel.service.name=${spring.application.name}
otel.exporter.otlp.endpoint=http://jaeger.transport-monitoring.svc.cluster.local:4318
otel.exporter.otlp.protocol=http/protobuf
otel.traces.exporter=otlp
```

Pour geolocation-service (Python) :

```python
# app.py
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger.transport-monitoring.svc.cluster.local:4318/v1/traces
```

### Personnaliser l'endpoint Jaeger

Si Jaeger est déployé ailleurs, modifier la variable d'environnement :

```bash
# Pour les services Java
export OTEL_EXPORTER_OTLP_ENDPOINT=http://your-jaeger-host:4318

# Pour le service Python
export OTEL_EXPORTER_OTLP_ENDPOINT=http://your-jaeger-host:4318/v1/traces
```

## 📈 Métriques et Tags

### Tags automatiques inclus

Tous les services tracent automatiquement :
- **http.method** : GET, POST, etc.
- **http.url** : URL de la requête
- **http.status_code** : 200, 404, 500, etc.
- **service.name** : Nom du microservice
- **span.kind** : SERVER, CLIENT, INTERNAL

### Tags personnalisés (Java)

Pour les services Spring Boot, des tags supplémentaires sont ajoutés :
- **db.system** : postgresql, mysql
- **db.statement** : Requête SQL exécutée
- **spring.method** : Méthode du contrôleur

## 🧪 Tester le tracing

### 1. Générer du trafic

```bash
# Obtenir un token JWT
TOKEN=$(curl -X POST http://kowihan.local/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' \
  | jq -r '.token')

# Faire des requêtes tracées
curl -H "Authorization: Bearer $TOKEN" \
  http://kowihan.local/api/users/me

curl -H "Authorization: Bearer $TOKEN" \
  http://kowihan.local/api/users/me/loyalty

curl -H "Authorization: Bearer $TOKEN" \
  http://kowihan.local/api/geolocation/bus/BUS-12
```

### 2. Vérifier dans Jaeger

1. Ouvrir http://localhost:30686
2. Sélectionner "user-service" ou "geolocation-service"
3. Cliquer sur "Find Traces"
4. Observer les traces générées

Vous devriez voir :
- **Requête HTTP** au service
- **Requête SQL** à la base de données (pour user-service)
- **Opération Redis** (pour geolocation-service)

## 🐛 Dépannage

### Jaeger ne reçoit pas de traces

```bash
# Vérifier que Jaeger est accessible depuis les pods
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://jaeger.transport-monitoring.svc.cluster.local:4318/v1/traces

# Vérifier les logs des services
kubectl logs deployment/user-service -n transport-prod | grep -i "otel\|telemetry"
```

### Services ne démarrent pas après ajout du tracing

```bash
# Vérifier les dépendances Maven
cd user-service
mvn dependency:tree | grep opentelemetry

# Rebuild sans cache
docker build -t user-service:latest . --no-cache

# Vérifier les logs d'erreur
kubectl logs deployment/user-service -n transport-prod --tail=100
```

### Interface Jaeger inaccessible

```bash
# Vérifier le pod Jaeger
kubectl get pods -n transport-monitoring

# Vérifier les logs Jaeger
kubectl logs -n transport-monitoring deployment/jaeger

# Vérifier le service
kubectl get svc -n transport-monitoring
```

## 📚 Ressources

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Java](https://opentelemetry.io/docs/instrumentation/java/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Spring Boot + OpenTelemetry](https://opentelemetry.io/docs/instrumentation/java/automatic/spring-boot/)

## 🎯 Avantages du tracing distribué

✅ **Débogage rapide** : Identifier instantanément où une requête ralentit
✅ **Visibilité complète** : Voir toutes les étapes d'une requête multi-services
✅ **Analyse de performance** : Comparer les durées des différents services
✅ **Détection d'erreurs** : Repérer les erreurs cachées dans les appels inter-services
✅ **Documentation vivante** : Voir en temps réel comment les services communiquent

---

**Note** : Le tracing distribué avec Jaeger est particulièrement utile pour comprendre les problèmes de performance dans une architecture microservices complexe comme celle du système de transport urbain ENSIAS.
