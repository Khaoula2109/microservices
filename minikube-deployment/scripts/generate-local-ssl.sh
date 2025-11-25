#!/bin/bash

# Script pour générer un certificat SSL auto-signé pour le développement local
# Usage: ./generate-local-ssl.sh

set -e

echo "🔐 Génération d'un certificat SSL auto-signé pour kowihan.local..."

# Créer le répertoire pour les certificats
mkdir -p ../certs

# Générer la clé privée
openssl genrsa -out ../certs/kowihan.local.key 2048

# Générer le certificat (valide 365 jours)
openssl req -new -x509 -key ../certs/kowihan.local.key -out ../certs/kowihan.local.crt -days 365 -subj "/CN=kowihan.local/O=Kowihan Transport/C=MA" \
  -addext "subjectAltName=DNS:kowihan.local,DNS:*.kowihan.local"

echo "✅ Certificat généré avec succès!"
echo ""
echo "📁 Fichiers créés:"
echo "  - ../certs/kowihan.local.key (clé privée)"
echo "  - ../certs/kowihan.local.crt (certificat)"
echo ""
echo "🔧 Prochaines étapes:"
echo "1. Créer le secret Kubernetes:"
echo "   kubectl create secret tls kowihan-local-tls \\"
echo "     --key=../certs/kowihan.local.key \\"
echo "     --cert=../certs/kowihan.local.crt \\"
echo "     -n transport-prod"
echo ""
echo "2. Faire confiance au certificat sur votre machine:"
echo ""
echo "   📱 Windows:"
echo "   - Double-cliquer sur kowihan.local.crt"
echo "   - Installer le certificat → Magasin: 'Autorités de certification racines de confiance'"
echo ""
echo "   🍎 macOS:"
echo "   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ../certs/kowihan.local.crt"
echo ""
echo "   🐧 Linux (Ubuntu/Debian):"
echo "   sudo cp ../certs/kowihan.local.crt /usr/local/share/ca-certificates/"
echo "   sudo update-ca-certificates"
echo ""
echo "   🦊 Firefox (tous OS):"
echo "   Paramètres → Vie privée et sécurité → Certificats → Afficher les certificats"
echo "   → Autorités → Importer → Sélectionner kowihan.local.crt"
echo ""
echo "3. Appliquer la configuration Ingress avec TLS:"
echo "   kubectl apply -f ../manifests/ingress/ingress-tls.yaml"
echo ""
echo "4. Accéder à https://kowihan.local/scanner"
echo ""
