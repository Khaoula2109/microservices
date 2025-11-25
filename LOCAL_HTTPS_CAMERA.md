# Caméra Fonctionnelle sur http://kowihan.local/scanner

## 🎯 Objectif

Faire fonctionner la caméra sur `http://kowihan.local/scanner` (ou mieux, `https://kowihan.local/scanner`)

## ⚠️ Le Problème

Les navigateurs modernes **bloquent l'accès à la caméra** sur HTTP, SAUF sur :
- `localhost`
- `127.0.0.1`
- Sites HTTPS

Donc `http://kowihan.local` **ne permet PAS** l'accès caméra par défaut.

## ✅ Solutions (du Plus Propre au Plus Rapide)

---

## Solution 1: HTTPS Local avec Certificat Auto-signé ⭐ RECOMMANDÉ

C'est la solution la plus propre et professionnelle. Vous aurez `https://kowihan.local/scanner` avec caméra fonctionnelle.

### Étape 1: Générer le Certificat SSL

```bash
cd minikube-deployment/scripts
./generate-local-ssl.sh
```

Ce script va créer :
- `certs/kowihan.local.key` (clé privée)
- `certs/kowihan.local.crt` (certificat)

### Étape 2: Créer le Secret Kubernetes

```bash
kubectl create secret tls kowihan-local-tls \
  --key=minikube-deployment/certs/kowihan.local.key \
  --cert=minikube-deployment/certs/kowihan.local.crt \
  -n transport-prod
```

### Étape 3: Faire Confiance au Certificat sur Votre Machine

#### 🪟 Windows

1. Double-cliquer sur `kowihan.local.crt`
2. Cliquer sur "Installer le certificat"
3. Sélectionner "Ordinateur local"
4. Choisir "Placer tous les certificats dans le magasin suivant"
5. Cliquer sur "Parcourir" → Sélectionner **"Autorités de certification racines de confiance"**
6. Cliquer sur "Suivant" puis "Terminer"
7. Redémarrer le navigateur

#### 🍎 macOS

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  minikube-deployment/certs/kowihan.local.crt
```

Puis redémarrer le navigateur.

#### 🐧 Linux (Ubuntu/Debian)

```bash
sudo cp minikube-deployment/certs/kowihan.local.crt \
  /usr/local/share/ca-certificates/kowihan.local.crt

sudo update-ca-certificates
```

Pour Fedora/RHEL :
```bash
sudo cp minikube-deployment/certs/kowihan.local.crt \
  /etc/pki/ca-trust/source/anchors/

sudo update-ca-trust
```

Redémarrer le navigateur.

#### 🦊 Firefox (Tous OS)

Firefox utilise son propre magasin de certificats :

1. Ouvrir Firefox
2. Menu → Paramètres
3. Vie privée et sécurité
4. Certificats → Afficher les certificats
5. Onglet "Autorités"
6. Importer → Sélectionner `kowihan.local.crt`
7. Cocher "Faire confiance à ce CA pour identifier des sites web"
8. OK

### Étape 4: Appliquer la Configuration Ingress avec TLS

```bash
kubectl apply -f minikube-deployment/manifests/ingress/ingress-tls.yaml
```

### Étape 5: Vérifier

```bash
# Attendre que l'Ingress soit prêt
kubectl get ingress -n transport-prod

# Tester
curl -k https://kowihan.local/scanner
```

### Étape 6: Accéder

```
https://kowihan.local/scanner
```

✅ **La caméra fonctionne maintenant !**

---

## Solution 2: Configuration Navigateur pour Traiter kowihan.local comme Sécurisé

Plus rapide, mais moins propre. Permet d'utiliser HTTP.

### Chrome / Edge

#### Méthode A: Via Flags

1. Ouvrir Chrome
2. Aller à `chrome://flags`
3. Chercher "Insecure origins treated as secure"
4. Ajouter : `http://kowihan.local`
5. Cliquer sur "Relaunch"

#### Méthode B: Ligne de Commande

**Windows :**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --unsafely-treat-insecure-origin-as-secure="http://kowihan.local" ^
  --user-data-dir=%TEMP%\chrome-dev
```

**macOS :**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --unsafely-treat-insecure-origin-as-secure="http://kowihan.local" \
  --user-data-dir=/tmp/chrome-dev
```

**Linux :**
```bash
google-chrome \
  --unsafely-treat-insecure-origin-as-secure="http://kowihan.local" \
  --user-data-dir=/tmp/chrome-dev
```

### Firefox

1. Aller à `about:config`
2. Accepter le risque
3. Chercher `media.devices.insecure.enabled`
4. Mettre à `true`
5. Chercher `media.getusermedia.insecure.enabled`
6. Mettre à `true`
7. Redémarrer Firefox

⚠️ **ATTENTION**: Ces configurations sont pour le DÉVELOPPEMENT uniquement !

---

## Solution 3: Port-Forward vers Localhost

Utiliser `kubectl port-forward` pour accéder via `localhost` où la caméra fonctionne nativement.

```bash
kubectl port-forward -n transport-prod svc/tickets-service 8082:8082
```

Puis accéder à :
```
http://localhost:8082/scanner
```

✅ **La caméra fonctionne car c'est localhost !**

**Avantages :**
- Aucune configuration nécessaire
- Fonctionne immédiatement
- Pas besoin de certificat

**Inconvénients :**
- Pas de load balancing
- Un seul pod
- Pas de routing Ingress
- Faut laisser le terminal ouvert

---

## Solution 4: Utiliser mDNS (.local)

Sur certains systèmes (macOS notamment), les domaines `.local` sont traités spécialement via mDNS.

### macOS

Sur macOS, `kowihan.local` peut être résolu automatiquement si vous utilisez le Ingress DNS de Minikube :

```bash
minikube addons enable ingress-dns
```

Puis configurer le resolver :
```bash
sudo tee /etc/resolver/kowihan-local > /dev/null <<EOF
domain local
nameserver $(minikube ip)
search_order 1
timeout 5
EOF
```

Mais la caméra **ne fonctionnera toujours pas en HTTP**.

---

## Comparaison des Solutions

| Solution | Caméra HTTP | Caméra HTTPS | Difficulté | Recommandé |
|----------|-------------|--------------|------------|------------|
| 1. Certificat Auto-signé | ❌ | ✅ | Moyenne | ⭐⭐⭐ OUI |
| 2. Config Navigateur | ✅ | ❌ | Facile | Pour dev uniquement |
| 3. Port-Forward | ✅ | ❌ | Très facile | Rapide pour tester |
| 4. mDNS | ❌ | ✅ (avec cert) | Difficile | Dépend de l'OS |

---

## 🎯 Recommandation

**Pour le Développement Local** : **Solution 1** (Certificat Auto-signé)
- Une fois configuré, ça marche tout le temps
- Simule un environnement de production
- Professionnel
- Pas besoin de relancer avec des flags spéciaux

**Pour un Test Rapide** : **Solution 3** (Port-Forward)
- Fonctionne immédiatement
- Pas de configuration

**À Éviter en Production** : Solution 2 (Flags navigateur)
- Uniquement pour le développement
- Pas sécurisé

---

## 🚀 Script de Déploiement Complet (Solution 1)

J'ai créé un script automatique :

```bash
#!/bin/bash
# setup-local-https.sh

cd minikube-deployment

# 1. Générer le certificat
./scripts/generate-local-ssl.sh

# 2. Créer le secret Kubernetes
kubectl create secret tls kowihan-local-tls \
  --key=certs/kowihan.local.key \
  --cert=certs/kowihan.local.crt \
  -n transport-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Appliquer l'Ingress avec TLS
kubectl apply -f manifests/ingress/ingress-tls.yaml

echo "✅ Configuration HTTPS terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Faire confiance au certificat sur votre machine (voir instructions ci-dessus)"
echo "2. Accéder à https://kowihan.local/scanner"
echo "3. Autoriser l'accès caméra quand le navigateur demande"
echo ""
echo "🎥 La caméra devrait maintenant fonctionner!"
```

---

## 🧪 Test Final

Après avoir configuré HTTPS :

```bash
# Vérifier que HTTPS fonctionne
curl -k https://kowihan.local/scanner

# Ouvrir dans le navigateur
xdg-open https://kowihan.local/scanner  # Linux
open https://kowihan.local/scanner      # macOS
start https://kowihan.local/scanner     # Windows
```

**Résultat attendu** :
1. ✅ Connexion sécurisée (cadenas vert ou gris)
2. ✅ Page scanner chargée
3. ✅ Bouton "Démarrer le Scanner" fonctionne
4. ✅ Popup d'autorisation caméra apparaît
5. ✅ Caméra démarre et scanne les QR codes

---

## 🐛 Dépannage

### Le certificat n'est pas reconnu

**Chrome/Edge :**
1. Aller à `chrome://settings/security`
2. Gérer les certificats
3. Vérifier que le certificat est dans "Autorités racines de confiance"

**Firefox :**
1. `about:preferences#privacy`
2. Certificats → Afficher les certificats
3. Vérifier dans l'onglet "Autorités"

### Erreur "NET::ERR_CERT_AUTHORITY_INVALID"

Le certificat n'est pas encore reconnu. Recommencer l'étape 3 (Faire confiance au certificat).

### La caméra demande toujours l'autorisation

C'est normal la première fois. Cochez "Se souvenir de cette décision" pour ne plus avoir à autoriser.

### Erreur "Impossible d'accéder à la caméra"

1. Vérifier que vous êtes bien en HTTPS
2. Vérifier les permissions du navigateur
3. Cliquer sur le cadenas → Paramètres du site → Caméra → Autoriser

---

## 📝 Résumé Simple

**Vous voulez** : `http://kowihan.local/scanner` avec caméra ✅

**La meilleure solution** :
1. Générer un certificat SSL auto-signé
2. L'installer sur votre machine
3. Configurer Ingress pour HTTPS
4. Accéder à `https://kowihan.local/scanner`

**Temps nécessaire** : ~10 minutes

**Résultat** : Caméra fonctionnelle ! 🎉

---

## 🔗 Liens Utiles

- Script de génération : `minikube-deployment/scripts/generate-local-ssl.sh`
- Ingress TLS : `minikube-deployment/manifests/ingress/ingress-tls.yaml`
- Ingress HTTP : `minikube-deployment/manifests/ingress/ingress.yaml`
- Guide Ingress : `INGRESS_DEPLOYMENT.md`
- Guide contrôleurs : `GUIDE_CONTROLEURS.md`
