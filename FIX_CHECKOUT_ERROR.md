# Fix Checkout "Service Unavailable" Error

## 🔍 Problème Identifié

Lors de la tentative d'achat d'un abonnement, l'erreur suivante se produit :
```
❌ [handleCheckout] Échec d'un achat: Service Unavailable
```

## 🎯 Cause

Le **subscription-service** n'est pas accessible par l'API Gateway. Cela peut être dû à :

1. **L'image Docker n'est pas à jour** : Les modifications récentes (ajout du code QR, barcode.service.js, etc.) ne sont pas dans l'image Docker déployée
2. **Le service ne démarre pas correctement** : Problème de connexion à la base de données ou à RabbitMQ
3. **Le Circuit Breaker est ouvert** : Trop d'échecs précédents ont ouvert le circuit breaker

## ✅ Solution

### Étape 1: Reconstruire l'Image Docker

```bash
cd subscription-service

# Construire l'image
docker build -t ghcr.io/khaoula2109/subscription-service:latest .

# Pousser vers le registre
docker push ghcr.io/khaoula2109/subscription-service:latest
```

### Étape 2: Redéployer sur Kubernetes

```bash
cd ../minikube-deployment

# Forcer le redémarrage avec la nouvelle image
kubectl rollout restart deployment subscription-service -n transport-prod

# Vérifier le statut
kubectl get pods -n transport-prod -l app=subscription-service

# Attendre que les pods soient prêts (Running)
kubectl wait --for=condition=ready pod -l app=subscription-service -n transport-prod --timeout=120s
```

### Étape 3: Vérifier les Logs

```bash
# Voir les logs du service
kubectl logs -n transport-prod -l app=subscription-service -f

# Vous devriez voir:
# ✅ Connecté à SQL Server avec succès.
# ✅ RabbitMQ connecté avec succès.
# ✅ Service d'abonnements prêt (publication et consommation).
# Service d'abonnements démarré sur http://localhost:3000
```

### Étape 4: Tester l'Endpoint

```bash
# Obtenir l'IP de Minikube
minikube ip

# Tester le health check (devrait retourner 200 OK)
curl http://$(minikube ip)/api/subscriptions/health

# Résultat attendu:
# {"status":"ok","service":"subscription-service"}
```

### Étape 5: Tester le Checkout depuis le Frontend

1. Ouvrir l'application : `http://kowihan.local/`
2. Se connecter avec un compte utilisateur
3. Aller sur la page des abonnements
4. Cliquer sur "S'abonner" pour un plan
5. Le checkout Stripe devrait s'ouvrir correctement

## 🔧 Vérifications Supplémentaires

### Vérifier que l'API Gateway route correctement

```bash
# Vérifier la configuration de l'API Gateway
kubectl logs -n transport-prod -l app=api-gateway | grep subscription

# Vous devriez voir des logs comme:
# 🔍 Requête reçue: POST /api/subscriptions/create-checkout-session
# ✅ Token valide pour: user@example.com
```

### Vérifier que la Base de Données est Accessible

```bash
# Vérifier que MSSQL est running
kubectl get pods -n transport-databases -l app=mssql

# Tester la connexion depuis le pod subscription-service
kubectl exec -it -n transport-prod $(kubectl get pod -n transport-prod -l app=subscription-service -o jsonpath='{.items[0].metadata.name}') -- sh

# Dans le pod, vérifier les variables d'environnement
env | grep DB_
```

### Vérifier que RabbitMQ est Accessible

```bash
# Vérifier que RabbitMQ est running
kubectl get pods -n transport-databases -l app=rabbitmq

# Tester depuis le pod subscription-service
kubectl exec -it -n transport-prod $(kubectl get pod -n transport-prod -l app=subscription-service -o jsonpath='{.items[0].metadata.name}') -- sh

# Dans le pod
env | grep RABBITMQ_
```

## 📋 Checklist de Vérification

- [ ] Image Docker reconstruite avec les dernières modifications
- [ ] Image poussée vers le registre (ghcr.io)
- [ ] Déploiement redémarré dans Kubernetes
- [ ] Pods subscription-service en état "Running"
- [ ] Logs montrent "Service d'abonnements prêt"
- [ ] Health check retourne 200 OK
- [ ] Base de données MSSQL accessible
- [ ] RabbitMQ accessible
- [ ] API Gateway route vers subscription-service
- [ ] Checkout fonctionne depuis le frontend

## 🚨 Si le Problème Persiste

### 1. Vérifier les Événements Kubernetes

```bash
kubectl get events -n transport-prod --sort-by='.lastTimestamp' | grep subscription-service
```

### 2. Décrire le Déploiement

```bash
kubectl describe deployment subscription-service -n transport-prod
```

### 3. Vérifier les Limites de Ressources

```bash
kubectl top pods -n transport-prod -l app=subscription-service
```

Si l'utilisation mémoire/CPU est proche des limites, augmenter les ressources dans `subscription-service.yaml`.

### 4. Vérifier le Service Kubernetes

```bash
kubectl describe service subscription-service -n transport-prod

# Vérifier que les endpoints sont présents
kubectl get endpoints subscription-service -n transport-prod
```

### 5. Redémarrer l'API Gateway

Si le Circuit Breaker est ouvert, redémarrer l'API Gateway peut aider :

```bash
kubectl rollout restart deployment api-gateway -n transport-prod
```

## 🎯 Résultat Attendu

Après avoir suivi ces étapes, le checkout devrait fonctionner :

1. ✅ L'utilisateur clique sur "S'abonner"
2. ✅ Une session Stripe Checkout est créée
3. ✅ L'utilisateur est redirigé vers Stripe
4. ✅ Après le paiement, l'abonnement est créé avec un QR code
5. ✅ Un email est envoyé avec le QR code
6. ✅ L'utilisateur peut utiliser l'abonnement

## 📚 Fichiers Concernés

- `subscription-service/src/services/subscription.service.js` - Logique de création de checkout
- `subscription-service/src/controllers/subscription.controller.js` - Controller
- `subscription-service/src/routes/index.routes.js` - Routes
- `subscription-service/Dockerfile` - Image Docker
- `minikube-deployment/manifests/microservices/subscription-service.yaml` - Déploiement K8s
- `apigateway/src/main/resources/application.properties` - Configuration du routing

---

**Note**: Cette erreur est typique après des modifications de code qui n'ont pas été reconstruites et redéployées. Toujours reconstruire l'image Docker après des modifications de code !
