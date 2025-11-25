# Guide d'Utilisation - Interface de Validation pour Contrôleurs

## Accès à l'Interface

### En Développement Local
```
http://localhost:8082/scanner
```

### Sur le Réseau Local
```
http://[IP-DU-SERVEUR]:8082/scanner
```

## Fonctionnalités

L'interface permet de valider les tickets et abonnements de deux manières :

### 1. Scanner avec Caméra 📷

**Prérequis :**
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Caméra fonctionnelle
- Accès via localhost OU HTTPS

**Étapes :**
1. Ouvrir l'interface sur `http://localhost:8082/scanner`
2. Sélectionner l'onglet "📷 Scanner QR Code"
3. Choisir le type de titre (Ticket ou Abonnement)
4. Cliquer sur "Démarrer le Scanner"
5. Autoriser l'accès à la caméra si demandé
6. Présenter le QR code devant la caméra
7. La validation se fait automatiquement

**Note importante :** Pour utiliser la caméra en HTTP, vous devez être sur `localhost` ou `127.0.0.1`. Pour un accès depuis un autre appareil, voir `HTTP_CAMERA_ACCESS.md`.

### 2. Saisie Manuelle ⌨️

**Étapes :**
1. Sélectionner l'onglet "⌨️ Saisie Manuelle"
2. Choisir le type de titre
3. Scanner le QR code avec une application mobile (Google Lens, Scanner QR, etc.)
4. Copier le texte/données affiché par l'application
5. Coller dans le champ "Données du QR Code"
6. Cliquer sur "Valider"

✅ **Cette méthode fonctionne partout, même sans caméra !**

## Résultats de Validation

### Titre Valide ✅

L'interface affiche en **vert** :
- Message de confirmation
- 👤 Nom du passager
- 📧 Email du passager
- 📱 Numéro de téléphone (si disponible)
- 🎫 Type de ticket ou plan d'abonnement
- 📊 Statut
- 📅 Date d'achat/création
- ⏰ Date d'expiration/fin de validité
- Image du QR code original

**Actions :**
- Autoriser le voyageur à monter
- Noter mentalement ou photographier les informations si nécessaire

### Titre Invalide ❌

L'interface affiche en **rouge/orange** :
- Message d'erreur explicite :
  - "Ticket expiré"
  - "Abonnement non actif"
  - "Ticket déjà utilisé"
  - "QR Code invalide"
- Informations du titre (si disponible)
- Raison du refus

**Actions :**
- Refuser l'accès
- Expliquer la raison au passager
- Diriger vers le service client si nécessaire

## Types de Titres

### Tickets

#### SIMPLE
- Validité : 2 heures après l'achat
- Usage : Une seule validation

#### JOURNEE
- Validité : Jusqu'à minuit du jour d'achat
- Usage : Illimité pendant la période

#### HEBDO
- Validité : 7 jours après l'achat
- Usage : Illimité pendant la période

#### MENSUEL
- Validité : 30 jours après l'achat
- Usage : Illimité pendant la période

### Abonnements

#### Abonnement Mensuel
- Durée : 30 jours
- Usage : Illimité pendant la période
- Statut doit être "active"

#### Abonnement Annuel
- Durée : 365 jours
- Usage : Illimité pendant la période
- Statut doit être "active"

## Situations Particulières

### QR Code Illisible
1. Essayer de scanner plusieurs fois sous différents angles
2. Vérifier l'éclairage
3. Si échec, utiliser la saisie manuelle
4. En dernier recours, demander au passager de montrer l'email original

### Pas d'Accès Internet
⚠️ La validation nécessite une connexion Internet active.
- L'interface ne peut pas valider hors ligne
- Vérifier votre connexion
- En cas de panne réseau, noter les informations et valider manuellement selon les procédures de l'entreprise

### Doute sur la Validité
Si vous avez un doute :
1. Vérifier attentivement toutes les informations affichées
2. Comparer avec le nom/ID du passager si possible
3. En cas de doute persistant, contacter un superviseur

### Suspicion de Fraude
Si le QR code semble suspect :
1. Vérifier la correspondance entre le passager et les informations affichées
2. Noter le nom, email et ID du titre
3. Signaler au superviseur immédiatement
4. Ne pas bloquer le passage si le système indique "valide" (risque d'erreur)

## Dépannage

### La caméra ne fonctionne pas
**Solutions :**
1. Vérifier que vous êtes sur `localhost` ou HTTPS
2. Vérifier les permissions du navigateur (icône 🔒 dans la barre d'adresse)
3. Redémarrer le navigateur
4. Utiliser l'onglet "Saisie Manuelle"

### Message "Service non disponible"
**Causes possibles :**
- Serveur en maintenance
- Problème réseau
- Service temporairement indisponible

**Actions :**
1. Attendre quelques secondes et réessayer
2. Rafraîchir la page (F5)
3. Contacter le support technique
4. Appliquer les procédures manuelles de secours

### L'interface ne s'affiche pas
1. Vérifier l'URL : `http://localhost:8082/scanner`
2. Vérifier que le service est démarré
3. Essayer un autre navigateur
4. Vider le cache du navigateur (Ctrl+Shift+Delete)

## Bonnes Pratiques

✅ **À FAIRE :**
- Toujours vérifier le résultat affiché (vert ou rouge)
- Lire le message de validation
- Vérifier la date d'expiration pour les cas limites
- Être poli et professionnel avec les passagers
- Signaler les problèmes techniques rapidement

❌ **À NE PAS FAIRE :**
- Laisser passer un titre invalide (rouge)
- Ignorer les messages d'erreur
- Partager vos identifiants d'accès
- Prendre des décisions basées uniquement sur le QR code visuel
- Bloquer un passager si le système dit "valide" (même si doute)

## Contact Support

En cas de problème technique :
- 📧 Email support : support@kowihan.com
- 📞 Téléphone : +212 XXX-XXXXXX
- 💬 Chat interne : [lien si disponible]

## Formation

Pour une formation complète sur l'utilisation du système :
- Consulter `BARCODE_SYSTEM.md` pour les détails techniques
- Consulter `HTTP_CAMERA_ACCESS.md` pour les problèmes d'accès caméra
- Demander une session de formation au superviseur

---

**Version :** 1.0
**Dernière mise à jour :** 2025-11-25
**Service :** Kowihan Transport
