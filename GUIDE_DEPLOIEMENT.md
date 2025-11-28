# 🚀 Guide de Déploiement - Nouvelles Fonctionnalités

## ⚡ Déploiement Automatique (Recommandé)

Sur **votre machine locale** :

```bash
cd ~/Desktop/microservices
./deploy-all-fixes.sh
```

Ce script fait automatiquement :
- ✅ Configuration PostgreSQL (ajout colonne loyalty_points)
- ✅ Rebuild des 3 images Docker
- ✅ Restart des déploiements Kubernetes
- ✅ Vérification de l'état

---

## 🛠️ Déploiement Manuel (si le script échoue)

### 1️⃣ Fixer PostgreSQL

```bash
# Trouver le pod PostgreSQL
kubectl get pods -n transport-databases

# Se connecter (remplacez <POD_NAME> par le nom réel)
kubectl exec -it -n transport-databases <POD_NAME> -- bash

# Dans le pod, ouvrir psql
psql -U kowihan -d user_db

# Exécuter le SQL
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
UPDATE app_users SET loyalty_points = 0 WHERE loyalty_points IS NULL;
ALTER TABLE app_users ALTER COLUMN loyalty_points SET NOT NULL;

-- Vérifier
\d app_users

-- Quitter
\q
exit
```

### 2️⃣ Rebuild les Images

```bash
cd ~/Desktop/microservices

# user-service
cd user-service
docker build -t user-service:latest .
cd ..

# geolocation-service
cd geolocation-service
docker build -t geolocation-service:latest .
cd ..

# frontend
cd Frontend/project
docker build -t frontend:latest .
cd ../..
```

### 3️⃣ Redéployer

```bash
kubectl rollout restart deployment user-service -n transport-prod
kubectl rollout restart deployment geolocation-service -n transport-prod
kubectl rollout restart deployment frontend -n transport-prod
```

### 4️⃣ Vérifier

```bash
# État des pods
kubectl get pods -n transport-prod

# Logs user-service
kubectl logs -f deployment/user-service -n transport-prod

# Logs geolocation-service
kubectl logs -f deployment/geolocation-service -n transport-prod
```

---

## 🔍 Déploiement du Tracing Distribué (Jaeger)

### Déploiement Automatique

```bash
cd ~/Desktop/microservices
./deploy-jaeger-tracing.sh
```

Ce script :
- ✅ Déploie Jaeger sur Kubernetes (namespace: transport-monitoring)
- ✅ Rebuild les services avec support OpenTelemetry
- ✅ Redémarre les déploiements
- ✅ Configure le tracing distribué

**Accès à l'interface Jaeger:**
- Via NodePort: `http://localhost:30686`
- Via port-forward: `kubectl port-forward -n transport-monitoring svc/jaeger-ui 16686:16686`

📚 **Documentation complète:** Voir `JAEGER_TRACING_GUIDE.md`

---

## ✅ Nouvelles Fonctionnalités Disponibles

Accédez à **https://kowihan.local** et testez :

### 1. 📊 Historique Paiements
- **Accès :** Page d'accueil → "Historique Paiements"
- **Ou :** Mon Compte → Bouton "Historique Paiements"
- **Fonctionnalités :**
  - Voir tous vos achats (tickets + abonnements)
  - Filtrer par type
  - Statistiques : total dépensé, nombre de transactions
  - Export PDF (à venir)

### 2. 🚌 Capacité Bus (Temps Réel)
- **Accès :** Carte Live → Cliquer sur n'importe quel bus
- **Ou :** Plannings Bus → Section "Bus en Service"
- **Fonctionnalités :**
  - Places occupées / totales
  - Places disponibles
  - Taux d'occupation (jauge colorée)
  - Mise à jour toutes les 8 secondes

### 3. ⭐ Programme Fidélité
- **Accès :** Page d'accueil → "Programme Fidélité"
- **Fonctionnalités :**
  - Voir vos points de fidélité
  - 3 paliers de réduction :
    - Bronze (100 pts) → 5%
    - Argent (250 pts) → 10%
    - Or (500 pts) → 15%
  - Gagner des points :
    - 10 points par ticket
    - 50 points par abonnement
  - Échanger vos points contre des réductions

### 4. 🗺️ Suggestions d'Itinéraires
- **Accès :** Page d'accueil → "Suggestions d'Itinéraires"
- **Fonctionnalités :**
  - Entrer départ et destination
  - Algorithme calcule le meilleur itinéraire
  - Affiche :
    - Ligne de bus recommandée
    - Nombre d'arrêts
    - Temps estimé
    - Distance
  - Plusieurs suggestions triées par rapidité

---

## 🔍 Dépannage

### user-service crashe avec "loyalty_points does not exist"

```bash
# Solution : Ajouter la colonne manuellement
kubectl get pods -n transport-databases
kubectl exec -it -n transport-databases <POSTGRES_POD> -- psql -U kowihan -d user_db -c "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0 NOT NULL;"
kubectl rollout restart deployment user-service -n transport-prod
```

### Mixed Content Error (HTTP/HTTPS)

✅ **DÉJÀ FIXÉ** dans le dernier commit
- Les URLs sont maintenant relatives (`/api/*`)
- Compatible HTTPS

### Pods en CrashLoopBackOff

```bash
# Vérifier les logs
kubectl logs <POD_NAME> -n transport-prod --tail=50

# Restart manuel
kubectl delete pod <POD_NAME> -n transport-prod
```

### Frontend ne se met pas à jour

```bash
# Forcer le rebuild sans cache
cd ~/Desktop/microservices/Frontend/project
docker build -t frontend:latest . --no-cache

# Supprimer les anciens pods
kubectl delete pods -l app=frontend -n transport-prod
```

---

## 📋 Checklist de Vérification

- [ ] PostgreSQL : colonne `loyalty_points` existe
- [ ] user-service : Running sans erreurs
- [ ] geolocation-service : Running, capacité affichée dans logs
- [ ] frontend : Running
- [ ] Site accessible à https://kowihan.local
- [ ] Historique Paiements fonctionne
- [ ] Capacité bus visible sur carte
- [ ] Programme Fidélité accessible
- [ ] Suggestions itinéraires fonctionnelles
- [ ] Jaeger : Interface accessible sur http://localhost:30686
- [ ] Tracing : Traces visibles dans Jaeger après requêtes

---

## 💡 Commandes Utiles

```bash
# Voir tous les pods
kubectl get pods -n transport-prod

# Voir les logs en temps réel
kubectl logs -f deployment/user-service -n transport-prod

# Accéder à un pod
kubectl exec -it deployment/user-service -n transport-prod -- bash

# Restart d'un service
kubectl rollout restart deployment/user-service -n transport-prod

# État d'un rollout
kubectl rollout status deployment/user-service -n transport-prod

# Décrire un pod (pour voir les erreurs)
kubectl describe pod <POD_NAME> -n transport-prod
```

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs des pods
2. L'état de PostgreSQL
3. Les images Docker sont bien reconstruites
4. Le bon namespace est utilisé (`transport-prod`)

Bonne chance ! 🚀
