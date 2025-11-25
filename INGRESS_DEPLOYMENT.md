# Déploiement avec Ingress et Nom de Domaine

## Configuration Actuelle

### Domaine
- **Principal**: `kowihan.local`
- **Monitoring**: `prometheus.kowihan.local`, `grafana.kowihan.local`

### Routes Ingress

```yaml
# Scanner pour contrôleurs (accès direct au tickets-service)
http://kowihan.local/scanner

# API de validation via API Gateway
http://kowihan.local/api/tickets/validate-qr/{qrCode}
http://kowihan.local/api/subscriptions/validate-qr/{qrCode}

# Frontend
http://kowihan.local/

# Monitoring
http://prometheus.kowihan.local/
http://grafana.kowihan.local/
```

## Comment ça Fonctionne

### 1. Accès au Scanner

**URL**: `http://kowihan.local/scanner`

L'Ingress route `/scanner` directement vers le **tickets-service:8082**.

**Avantages**:
- Pas besoin de passer par l'API Gateway
- Accès public sans authentification
- Fonctionne même si l'API Gateway est down

### 2. Validation des QR Codes

L'interface scanner appelle:
```javascript
// Pour les tickets
GET /api/tickets/validate-qr/{qrCode}

// Pour les abonnements (via proxy dans tickets-service)
GET /api/subscriptions/validate-qr/{qrCode}
```

Ces appels utilisent des **URLs relatives**, donc ils passent automatiquement par Ingress:
```
http://kowihan.local/api/... → API Gateway → Services
```

### 3. Flux de Validation

```
Contrôleur
    ↓
http://kowihan.local/scanner
    ↓
Ingress → tickets-service:8082
    ↓
Interface Web (HTML + JS)
    ↓
Scan QR Code
    ↓
API Call: /api/tickets/validate-qr/XXX
    ↓
Ingress → API Gateway:8081 → tickets-service:8082
    ↓
Réponse avec infos passager
```

## Configuration DNS

### Développement Local (Minikube)

Ajouter dans `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):

```bash
# Obtenir l'IP de Minikube
minikube ip

# Exemple de résultat: 192.168.49.2
# Ajouter dans /etc/hosts:
192.168.49.2  kowihan.local
192.168.49.2  prometheus.kowihan.local
192.168.49.2  grafana.kowihan.local
```

### Production avec Nom de Domaine Réel

#### Option 1: DNS Public
Configurer vos enregistrements DNS:
```
A     kowihan.com          → IP_LOAD_BALANCER
A     prometheus.kowihan.com → IP_LOAD_BALANCER
A     grafana.kowihan.com    → IP_LOAD_BALANCER
```

#### Option 2: DNS Interne (Réseau Local)
Configurer votre serveur DNS interne pour pointer vers l'IP du cluster.

## Accès Caméra avec Ingress

### HTTP (Développement)

L'Ingress est configuré avec `ssl-redirect: "false"`, donc HTTP fonctionne.

**Pour la caméra en HTTP**:
1. Ajouter `kowihan.local` dans `/etc/hosts` avec l'IP de Minikube
2. Accéder via `http://kowihan.local/scanner`
3. La caméra **ne fonctionnera PAS** car `kowihan.local` n'est pas `localhost`

**Solutions**:
- Utiliser l'onglet "Saisie Manuelle"
- Configurer le navigateur (voir `HTTP_CAMERA_ACCESS.md`)
- Utiliser HTTPS (recommandé)

### HTTPS (Production)

#### Avec Cert-Manager + Let's Encrypt

1. **Installer cert-manager**:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. **Créer un ClusterIssuer**:
```yaml
# cert-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@kowihan.com  # Votre email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

3. **Mettre à jour l'Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: transport-ingress
  namespace: transport-prod
  annotations:
    # Activer SSL
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    # Cert-manager
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    # ... autres annotations
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - kowihan.com
    - prometheus.kowihan.com
    - grafana.kowihan.com
    secretName: kowihan-tls
  rules:
  - host: kowihan.com  # Remplacer kowihan.local par votre domaine
    # ... rest of config
```

4. **Appliquer**:
```bash
kubectl apply -f cert-issuer.yaml
kubectl apply -f ingress.yaml
```

Let's Encrypt va automatiquement générer et renouveler les certificats.

**Résultat**: `https://kowihan.com/scanner` avec caméra fonctionnelle ! ✅

## Déploiement

### 1. Construire les Images Docker

```bash
# Tickets Service
cd tickets-service
docker build -t ghcr.io/khaoula2109/tickets-service:latest .
docker push ghcr.io/khaoula2109/tickets-service:latest

# Subscription Service
cd subscription-service
docker build -t ghcr.io/khaoula2109/subscription-service:latest .
docker push ghcr.io/khaoula2109/subscription-service:latest
```

### 2. Déployer sur Minikube

```bash
cd minikube-deployment

# Démarrer Minikube avec Ingress
./start-minikube.sh

# Déployer tous les services
./deploy-all.sh

# Attendre que tout soit prêt
kubectl get pods -n transport-prod
```

### 3. Configurer /etc/hosts

```bash
# Obtenir l'IP
minikube ip

# Ajouter dans /etc/hosts (sudo required)
sudo sh -c "echo '$(minikube ip)  kowihan.local' >> /etc/hosts"
```

### 4. Tester

```bash
# Ouvrir le scanner
xdg-open http://kowihan.local/scanner  # Linux
open http://kowihan.local/scanner      # macOS
start http://kowihan.local/scanner     # Windows

# Tester l'API
curl http://kowihan.local/api/tickets/validate-qr/TEST
```

## Vérification

### Scanner Accessible ?
```bash
curl -I http://kowihan.local/scanner
# Doit retourner: HTTP/1.1 200 OK
```

### API de Validation Accessible ?
```bash
# Tickets
curl http://kowihan.local/api/tickets/validate-qr/INVALID_CODE

# Abonnements
curl http://kowihan.local/api/subscriptions/validate-qr/INVALID_CODE
```

### Logs
```bash
# Voir les logs du tickets-service
kubectl logs -n transport-prod -l app=tickets-service -f

# Voir les logs de l'Ingress
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f
```

## Problèmes Courants

### Scanner ne s'affiche pas

**Vérifier**:
```bash
# 1. Service tickets-service est running
kubectl get pods -n transport-prod -l app=tickets-service

# 2. Ingress est configuré
kubectl describe ingress transport-ingress -n transport-prod

# 3. DNS résolu
ping kowihan.local
```

**Solution**:
```bash
# Redéployer l'Ingress
kubectl apply -f manifests/ingress/ingress.yaml

# Redémarrer l'Ingress controller
kubectl rollout restart deployment -n ingress-nginx ingress-nginx-controller
```

### La caméra ne fonctionne pas

**Causes**:
1. HTTP sur un domaine qui n'est pas localhost
2. Permissions navigateur
3. Caméra non disponible

**Solutions**:
1. Utiliser HTTPS (Let's Encrypt)
2. Utiliser l'onglet "Saisie Manuelle"
3. Configurer le navigateur (voir `HTTP_CAMERA_ACCESS.md`)

### API de validation échoue

**Vérifier**:
```bash
# API Gateway est running
kubectl get pods -n transport-prod -l app=api-gateway

# Tester directement le service
kubectl port-forward -n transport-prod svc/tickets-service 8082:8082
curl http://localhost:8082/api/tickets/validate-qr/TEST
```

## Architecture avec Ingress

```
                        Internet
                           |
                      [DNS: kowihan.local]
                           |
                    [Ingress Controller]
                           |
        +------------------+------------------+
        |                  |                  |
    /scanner            /api/*            /
        |                  |                  |
  tickets-service     api-gateway        frontend
      :8082              :8081             :80
        |
        +-- /api/tickets/validate-qr/*
        +-- /api/subscriptions/validate-qr/* (proxy)
```

## URLs de Production

Avec un vrai domaine `kowihan.com`:

- **Scanner**: `https://kowihan.com/scanner`
- **API Tickets**: `https://kowihan.com/api/tickets/validate-qr/{code}`
- **API Abonnements**: `https://kowihan.com/api/subscriptions/validate-qr/{code}`
- **Frontend**: `https://kowihan.com/`

## Scalabilité

L'Ingress supporte:
- ✅ Load balancing automatique (HPA configuré)
- ✅ Rolling updates sans downtime
- ✅ Multiples réplicas (2-5 pods par service)
- ✅ Health checks
- ✅ Auto-scaling basé sur CPU

## Sécurité

### En Production

1. **Activer HTTPS**:
   - Certificat Let's Encrypt (gratuit)
   - Redirection HTTP → HTTPS automatique

2. **Rate Limiting**:
```yaml
annotations:
  nginx.ingress.kubernetes.io/rate-limit: "10"
  nginx.ingress.kubernetes.io/limit-rps: "5"
```

3. **IP Whitelist** (optionnel):
```yaml
annotations:
  nginx.ingress.kubernetes.io/whitelist-source-range: "192.168.0.0/16,10.0.0.0/8"
```

4. **Basic Auth pour Monitoring**:
```bash
htpasswd -c auth admin
kubectl create secret generic grafana-auth --from-file=auth -n transport-prod
```

## Support

Pour plus d'informations:
- Configuration Ingress: `minikube-deployment/manifests/ingress/ingress.yaml`
- Guide contrôleurs: `GUIDE_CONTROLEURS.md`
- Accès caméra HTTP: `HTTP_CAMERA_ACCESS.md`
- Système barcode: `BARCODE_SYSTEM.md`

---

**Résumé**: Avec Ingress et un nom de domaine, le scanner fonctionne parfaitement. Pour la caméra, utilisez HTTPS en production avec Let's Encrypt. En développement, utilisez la saisie manuelle.
