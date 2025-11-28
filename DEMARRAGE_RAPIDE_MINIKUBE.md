# 🚀 Guide de Démarrage Rapide - Minikube

## 📋 Résumé des 5 Fonctionnalités Implémentées

Toutes les fonctionnalités sont prêtes à être déployées sur **votre environnement Minikube local** :

1. ✅ **Historique Paiements** - Affichage complet tickets + abonnements
2. ✅ **Capacité Bus Temps Réel** - Places occupées/disponibles sur carte
3. ✅ **Programme Fidélité** - Points + 3 paliers de réduction
4. ✅ **Suggestions Itinéraires** - Algorithme de recommandation
5. ✅ **Jaeger Distributed Tracing** - Monitoring microservices

---

## 🏁 Démarrage Rapide (5 minutes)

### Étape 1: Démarrer Minikube

```bash
cd ~/Desktop/microservices/minikube-deployment
./start-minikube.sh
```

### Étape 2: Déployer Jaeger Tracing

```bash
cd scripts
./deploy-jaeger.sh
```

✅ Ce script va automatiquement:
- Créer le namespace `transport-monitoring`
- Déployer Jaeger all-in-one
- Mettre à jour vos microservices avec configuration tracing
- Redémarrer les services

### Étape 3: Accéder à l'application

**Application principale:**
```bash
minikube tunnel
# Puis ouvrez: https://kowihan.local
```

**Interface Jaeger:**
```bash
minikube service jaeger-ui -n transport-monitoring
# Ouvre automatiquement votre navigateur sur Jaeger
```

---

## 🎯 Tester les Fonctionnalités

### 1. Historique Paiements

1. Connectez-vous à https://kowihan.local
2. Achetez quelques tickets ou abonnements
3. Allez dans **"Historique Paiements"** (menu ou page d'accueil)
4. Vérifiez:
   - ✅ Liste de tous vos achats
   - ✅ Statistiques (montant total, nombre transactions)
   - ✅ Filtrage par type

### 2. Capacité Bus Temps Réel

1. Allez sur **"Carte Live"**
2. Cliquez sur n'importe quel bus sur la carte
3. Vérifiez:
   - ✅ Capacité totale du bus
   - ✅ Places occupées / disponibles
   - ✅ Taux d'occupation en %
   - ✅ Jauge colorée (vert/jaune/rouge)

### 3. Programme Fidélité

1. Allez dans **"Programme Fidélité"**
2. Vérifiez vos points actuels
3. Voir les paliers:
   - 🥉 Bronze (100 pts) → 5% réduction
   - 🥈 Argent (250 pts) → 10% réduction
   - 🥇 Or (500 pts) → 15% réduction
4. Achetez des tickets pour gagner des points (10 pts/ticket)
5. Échangez vos points contre une réduction

### 4. Suggestions Itinéraires

1. Allez dans **"Suggestions d'Itinéraires"**
2. Entrez:
   - **Départ:** Ex: "Hay Riad"
   - **Destination:** Ex: "ENSIAS"
3. Cliquez sur "Rechercher"
4. Vérifiez:
   - ✅ Plusieurs suggestions d'itinéraires
   - ✅ Ligne de bus recommandée
   - ✅ Nombre d'arrêts
   - ✅ Temps estimé
   - ✅ Distance

### 5. Jaeger Distributed Tracing

1. Ouvrez l'interface Jaeger (via `minikube service jaeger-ui -n transport-monitoring`)
2. Faites des actions sur l'application (acheter ticket, voir carte, etc.)
3. Dans Jaeger:
   - Sélectionnez **"api-gateway"** dans le menu Service
   - Cliquez sur **"Find Traces"**
   - Explorez une trace pour voir:
     - ✅ Timeline complète de la requête
     - ✅ Tous les services appelés
     - ✅ Durée de chaque opération
     - ✅ Requêtes SQL, Redis, etc.

---

## 🔍 Commandes Utiles

### Vérifier l'état des pods

```bash
# Tous les microservices
kubectl get pods -n transport-prod

# Jaeger
kubectl get pods -n transport-monitoring

# Bases de données
kubectl get pods -n transport-databases
```

### Voir les logs d'un service

```bash
# User service
kubectl logs -f deployment/user-service -n transport-prod

# Geolocation service (pour voir les capacités bus)
kubectl logs -f deployment/geolocation-service -n transport-prod

# Jaeger
kubectl logs -f deployment/jaeger -n transport-monitoring
```

### Redémarrer un service

```bash
kubectl rollout restart deployment/user-service -n transport-prod
kubectl rollout restart deployment/geolocation-service -n transport-prod
```

### Accéder à Jaeger (plusieurs méthodes)

```bash
# Méthode 1: Via minikube service (recommandé)
minikube service jaeger-ui -n transport-monitoring

# Méthode 2: Via NodePort
MINIKUBE_IP=$(minikube ip)
echo "Jaeger UI: http://$MINIKUBE_IP:30686"

# Méthode 3: Via port-forward
kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686
# Puis: http://localhost:16686
```

---

## 📦 Architecture Déployée

```
┌─────────────────────────────────────────────────────────┐
│                   MINIKUBE CLUSTER                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Namespace: transport-prod                             │
│  ├── api-gateway (x2)          [TRACING ENABLED ✓]    │
│  ├── user-service (x2)         [TRACING ENABLED ✓]    │
│  ├── tickets-service (x2)      [TRACING ENABLED ✓]    │
│  ├── geolocation-service (x2)  [TRACING ENABLED ✓]    │
│  ├── subscription-service (x2)                         │
│  ├── routes-service (x2)                               │
│  ├── notification-service (x2)                         │
│  └── frontend (x2)                                     │
│                                                         │
│  Namespace: transport-databases                        │
│  ├── PostgreSQL (user_db)                              │
│  ├── MySQL (tickets_db)                                │
│  ├── Redis (geolocation cache)                         │
│  └── RabbitMQ (messaging)                              │
│                                                         │
│  Namespace: transport-monitoring                       │
│  └── Jaeger (distributed tracing)  [NEW! ✨]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Dépannage Rapide

### Problème: Pods en CrashLoopBackOff

```bash
# Voir les logs pour identifier l'erreur
kubectl logs <pod-name> -n transport-prod

# Exemples courants:
# - Erreur DB: Vérifier que PostgreSQL/MySQL sont démarrés
# - Erreur RabbitMQ: Vérifier que RabbitMQ est démarré
```

### Problème: Jaeger ne reçoit pas de traces

```bash
# 1. Vérifier que Jaeger tourne
kubectl get pods -n transport-monitoring

# 2. Vérifier que les services ont la variable OTEL
kubectl describe pod -n transport-prod -l app=user-service | grep OTEL

# 3. Redémarrer les services
kubectl rollout restart deployment/user-service -n transport-prod
kubectl rollout restart deployment/tickets-service -n transport-prod
kubectl rollout restart deployment/geolocation-service -n transport-prod
kubectl rollout restart deployment/api-gateway -n transport-prod
```

### Problème: Application inaccessible

```bash
# Vérifier que minikube tunnel tourne
minikube tunnel

# Vérifier l'ingress
kubectl get ingress -n transport-prod

# Alternative: Accéder via minikube IP
minikube ip
# Puis configurer /etc/hosts ou accéder directement
```

---

## 📚 Documentation Complète

- **FEATURES_SUMMARY.md** - Résumé détaillé des 5 fonctionnalités
- **JAEGER_TRACING_GUIDE.md** - Guide complet Jaeger (utilisation, debugging)
- **minikube-deployment/JAEGER_DEPLOYMENT.md** - Déploiement Jaeger sur Minikube
- **GUIDE_DEPLOIEMENT.md** - Guide général de déploiement

---

## ✅ Checklist de Vérification

Après le déploiement, vérifiez:

**Infrastructure:**
- [ ] Minikube démarré (`minikube status`)
- [ ] Tous les pods `Running` dans `transport-prod`
- [ ] Tous les pods `Running` dans `transport-databases`
- [ ] Jaeger pod `Running` dans `transport-monitoring`

**Fonctionnalités:**
- [ ] Application accessible sur https://kowihan.local
- [ ] Historique Paiements affiche les achats
- [ ] Capacité bus visible sur carte Live
- [ ] Programme Fidélité accessible et fonctionnel
- [ ] Suggestions Itinéraires retourne des résultats
- [ ] Jaeger UI accessible et affiche des traces

**Tracing:**
- [ ] Interface Jaeger ouverte
- [ ] Services visibles dans menu déroulant (api-gateway, user-service, etc.)
- [ ] Traces générées après utilisation de l'app
- [ ] Timeline et spans visibles dans les traces

---

## 🎓 Projet ENSIAS

**Context:**
- Université: ENSIAS
- Année: 3ème année Génie Logiciel
- Professeur: Mahmoud NASSAR
- Soutenance: 7 Novembre 2025
- Projet: Système Transport Urbain - Architecture Microservices

**Status:** ✅ **TOUTES LES 5 FONCTIONNALITÉS SONT COMPLÈTES!**

---

## 🎉 Félicitations!

Votre système de transport urbain est maintenant équipé de:
1. ✅ Historique des paiements complet
2. ✅ Monitoring capacité bus en temps réel
3. ✅ Programme de fidélité avec réductions
4. ✅ Suggestions d'itinéraires optimales
5. ✅ Traçage distribué avec Jaeger

**Tout est prêt pour la soutenance! 🚀🎓**

Pour démarrer immédiatement:
```bash
cd ~/Desktop/microservices/minikube-deployment/scripts
./deploy-jaeger.sh
```

Bon courage pour la soutenance! 💪
