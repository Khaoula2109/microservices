#!/bin/bash

# Script pour configurer HTTPS local avec certificat auto-signé
# Cela permet d'avoir la caméra fonctionnelle sur https://kowihan.local/scanner

set -e

echo "🚀 Configuration HTTPS local pour kowihan.local..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "generate-local-ssl.sh" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis minikube-deployment/scripts/"
    exit 1
fi

# 1. Générer le certificat SSL
echo "📜 Étape 1/4 : Génération du certificat SSL..."
./generate-local-ssl.sh

# 2. Vérifier que kubectl est configuré
echo ""
echo "🔧 Étape 2/4 : Vérification de kubectl..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Erreur: kubectl n'est pas configuré ou le cluster n'est pas accessible"
    echo "   Assurez-vous que Minikube est démarré: minikube start"
    exit 1
fi

# 3. Créer le namespace si nécessaire
echo ""
echo "📦 Étape 3/4 : Vérification du namespace..."
kubectl create namespace transport-prod --dry-run=client -o yaml | kubectl apply -f -

# 4. Créer ou mettre à jour le secret TLS
echo ""
echo "🔐 Étape 4/4 : Création du secret Kubernetes..."
kubectl create secret tls kowihan-local-tls \
  --key=../certs/kowihan.local.key \
  --cert=../certs/kowihan.local.crt \
  -n transport-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# 5. Appliquer l'Ingress avec TLS
echo ""
echo "🌐 Étape 5/5 : Application de la configuration Ingress avec TLS..."
kubectl apply -f ../manifests/ingress/ingress-tls.yaml

echo ""
echo "✅ Configuration HTTPS terminée avec succès!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PROCHAINES ÉTAPES IMPORTANTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Vous DEVEZ faire confiance au certificat sur votre machine :"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS :"
    echo "   sudo security add-trusted-cert -d -r trustRoot \\"
    echo "     -k /Library/Keychains/System.keychain \\"
    echo "     $(pwd)/../certs/kowihan.local.crt"
    echo ""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux (Ubuntu/Debian) :"
    echo "   sudo cp $(pwd)/../certs/kowihan.local.crt /usr/local/share/ca-certificates/"
    echo "   sudo update-ca-certificates"
    echo ""
    echo "🐧 Linux (Fedora/RHEL) :"
    echo "   sudo cp $(pwd)/../certs/kowihan.local.crt /etc/pki/ca-trust/source/anchors/"
    echo "   sudo update-ca-trust"
    echo ""
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows :"
    echo "   1. Double-cliquer sur $(pwd)/../certs/kowihan.local.crt"
    echo "   2. Installer le certificat → 'Autorités de certification racines de confiance'"
    echo ""
fi

echo "🦊 Firefox (tous OS) :"
echo "   Paramètres → Vie privée et sécurité → Certificats → Afficher"
echo "   → Autorités → Importer → $(pwd)/../certs/kowihan.local.crt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Une fois le certificat installé :"
echo "1. Redémarrer votre navigateur"
echo "2. Accéder à : https://kowihan.local/scanner"
echo "3. Autoriser l'accès à la caméra"
echo ""
echo "🎥 La caméra devrait maintenant fonctionner!"
echo ""
echo "Pour plus d'informations : LOCAL_HTTPS_CAMERA.md"
echo ""
