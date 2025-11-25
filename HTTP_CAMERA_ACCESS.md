# Guide d'Accès Caméra en HTTP

## Problème

Les navigateurs modernes (Chrome, Firefox, Safari, Edge) bloquent l'accès à la caméra sur les sites HTTP pour des raisons de sécurité. L'accès caméra est normalement réservé aux sites HTTPS et localhost.

## Solutions

### 1. Utiliser Localhost (Recommandé pour le Développement)

Les navigateurs autorisent l'accès caméra sur `localhost` même en HTTP.

**Accès:**
```
http://localhost:8082/scanner
ou
http://127.0.0.1:8082/scanner
```

✅ Fonctionne sans configuration supplémentaire

### 2. Configuration Chrome pour HTTP (Développement uniquement)

Pour permettre l'accès caméra sur HTTP pendant le développement :

#### Méthode A: Flag Chrome
1. Ouvrir Chrome
2. Aller à `chrome://flags`
3. Chercher "Insecure origins treated as secure"
4. Ajouter votre URL (ex: `http://192.168.1.100:8082`)
5. Relancer Chrome

#### Méthode B: Lancer Chrome avec flag
```bash
# Windows
chrome.exe --unsafely-treat-insecure-origin-as-secure="http://IP:8082" --user-data-dir=C:\temp\chrome-dev

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure="http://IP:8082" --user-data-dir=/tmp/chrome-dev

# Linux
google-chrome --unsafely-treat-insecure-origin-as-secure="http://IP:8082" --user-data-dir=/tmp/chrome-dev
```

⚠️ **ATTENTION:** Ne pas utiliser en production !

### 3. Configuration Firefox pour HTTP (Développement uniquement)

1. Ouvrir Firefox
2. Aller à `about:config`
3. Accepter le risque
4. Chercher `media.devices.insecure.enabled`
5. Mettre à `true`
6. Chercher `media.getusermedia.insecure.enabled`
7. Mettre à `true`

### 4. Utiliser un Tunnel HTTPS (Recommandé pour Tests)

Utiliser un service de tunnel pour exposer votre application locale en HTTPS :

#### ngrok
```bash
# Installation
# https://ngrok.com/download

# Lancer le tunnel
ngrok http 8082

# Vous obtenez une URL HTTPS publique
# https://abc123.ngrok.io/scanner
```

#### localtunnel
```bash
# Installation
npm install -g localtunnel

# Lancer le tunnel
lt --port 8082

# Vous obtenez une URL HTTPS publique
```

### 5. Saisie Manuelle (Alternative Sans Caméra)

L'interface inclut un onglet "Saisie Manuelle" qui permet :
- Scanner le QR code avec une application tierce
- Copier les données
- Coller dans l'interface web

✅ Fonctionne partout, HTTP ou HTTPS

## Configuration Recommandée par Environnement

### Développement Local
```
http://localhost:8082/scanner
```
- Caméra fonctionne nativement
- Aucune configuration nécessaire

### Tests en Réseau Local
**Option 1:** Tunnel ngrok/localtunnel (plus simple)
```bash
ngrok http 8082
```

**Option 2:** Configuration navigateur (moins sécurisé)
- Utiliser les flags Chrome/Firefox ci-dessus
- Remplacer IP:PORT par votre adresse réseau

### Production
**HTTPS OBLIGATOIRE**

Utilisez un certificat SSL :
- Let's Encrypt (gratuit)
- Certificat auto-signé (pour tests internes)
- Reverse proxy avec SSL (nginx, Apache)

```nginx
# Exemple nginx avec SSL
server {
    listen 443 ssl;
    server_name votredomaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8082;
    }
}
```

## Utilisation de l'Interface Scanner

### Tickets Service
```
http://localhost:8082/scanner
```

L'interface permet :
- Scanner un QR code avec la caméra
- Saisir manuellement les données du QR code
- Valider les tickets
- Valider les abonnements

### Endpoints API

**Validation Ticket:**
```
GET http://localhost:8082/api/tickets/validate-qr/{qrCodeData}
```

**Validation Abonnement:**
```
GET http://localhost:3002/api/subscriptions/validate-qr/{qrCodeData}
```

Les deux endpoints sont publics (pas d'authentification requise).

## Applications Mobiles Tierces pour Scanner

Si la caméra web ne fonctionne pas, utilisez une application mobile :

### Android
- QR Code Reader (gratuit)
- Google Lens
- Barcode Scanner

### iOS
- Caméra native (iOS 11+)
- QR Code Reader
- Scanner Pro

**Processus:**
1. Scanner le QR code avec l'application mobile
2. Copier le texte/données affiché
3. Coller dans l'onglet "Saisie Manuelle" de l'interface web

## Dépannage

### La caméra ne démarre pas
- Vérifier que vous êtes sur localhost ou HTTPS
- Vérifier les permissions du navigateur (cliquer sur l'icône 🔒 dans la barre d'adresse)
- Essayer un autre navigateur
- Utiliser l'onglet "Saisie Manuelle"

### Erreur "Permission denied"
- Le navigateur a bloqué l'accès caméra
- Aller dans les paramètres du site (🔒 → Paramètres du site)
- Autoriser l'accès à la caméra

### La validation échoue
- Vérifier que les services sont démarrés
- Vérifier les URLs des APIs dans la console du navigateur
- Essayer de copier-coller directement le QR code

## Sécurité

⚠️ **Important:**
- Ne JAMAIS utiliser les configurations HTTP en production
- Les flags de développement exposent votre système
- Toujours utiliser HTTPS en production
- Les certificats auto-signés sont acceptables pour les tests internes uniquement

## Support

Pour plus d'informations :
- Documentation complète : `BARCODE_SYSTEM.md`
- Interface scanner : `http://localhost:8082/scanner`
- Code source : `tickets-service/src/main/resources/static/controller-scanner.html`
