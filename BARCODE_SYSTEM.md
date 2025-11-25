# Système de Codes-Barres pour Tickets et Abonnements

## Vue d'ensemble

Ce système implémente des codes-barres QR réels pour les tickets et abonnements, permettant aux contrôleurs et administrateurs de scanner et valider les titres de transport.

## Fonctionnalités

### 1. Génération de Codes-Barres

#### Pour les Tickets
- **Service**: `BarcodeService.java` dans `tickets-service`
- **Bibliothèque**: ZXing (Google ZXing 3.5.3)
- **Format**: QR Code avec correction d'erreur niveau H
- **Taille**: 300x300 pixels
- **Données encodées** (JSON):
  ```json
  {
    "ticketId": "123",
    "userId": "456",
    "ticketType": "MENSUEL",
    "purchaseDate": "2025-11-25T10:00:00",
    "uniqueCode": "uuid",
    "type": "TICKET"
  }
  ```

#### Pour les Abonnements
- **Service**: `barcode.service.js` dans `subscription-service`
- **Bibliothèque**: qrcode (npm package 1.5.4)
- **Format**: QR Code avec correction d'erreur niveau H
- **Taille**: 300x300 pixels
- **Données encodées** (JSON):
  ```json
  {
    "subscriptionId": "789",
    "userId": "456",
    "planName": "Abonnement Mensuel",
    "endDate": "2025-12-25T23:59:59",
    "uniqueCode": "uuid",
    "type": "SUBSCRIPTION"
  }
  ```

### 2. Stockage

#### Base de données Tickets (MySQL)
```sql
ALTER TABLE tickets
ADD COLUMN qr_code_image LONGTEXT NULL;
```

#### Base de données Subscriptions (SQL Server)
```sql
ALTER TABLE Subscriptions
ADD QrCodeData NVARCHAR(MAX) NULL,
    QrCodeImage NVARCHAR(MAX) NULL;
```

- Les images sont stockées en Base64
- `qrCodeData`: Contient le JSON complet des informations
- `qrCodeImage`: Contient l'image PNG encodée en Base64

### 3. APIs de Validation

#### Tickets
**Endpoint**: `GET /api/tickets/validate-qr/{qrCode}`

**Réponse**:
```json
{
  "valid": true,
  "message": "Ticket valide - Bon voyage!",
  "ticketId": 123,
  "userId": 456,
  "ticketType": "MENSUEL",
  "status": "VALIDE",
  "purchaseDate": "2025-11-25T10:00:00",
  "validationDate": null,
  "expirationDate": "2025-12-25T10:00:00",
  "ownerName": "Jean Dupont",
  "ownerEmail": "jean.dupont@example.com",
  "ownerPhone": "+212600000000",
  "qrCodeImage": "base64_encoded_image..."
}
```

#### Abonnements
**Endpoint**: `GET /api/subscriptions/validate-qr/{qrCode}`

**Réponse**:
```json
{
  "valid": true,
  "message": "Abonnement valide - Bon voyage!",
  "subscriptionId": 789,
  "userId": 456,
  "planName": "Abonnement Mensuel",
  "status": "active",
  "endDate": "2025-12-25T23:59:59",
  "ownerName": "Jean Dupont",
  "ownerEmail": "jean.dupont@example.com",
  "qrCodeImage": "base64_encoded_image..."
}
```

### 4. Emails avec Codes-Barres

#### Template Ticket (`ticket-purchased.hbs`)
- Affiche l'image du QR code
- Instructions pour le passager
- Informations du ticket

#### Template Abonnement (`subscription-success.hbs`)
- Affiche l'image du QR code
- Informations de l'abonnement
- Date de validité

Les images sont intégrées directement dans l'email via:
```html
<img src="data:image/png;base64,{{qrCodeImage}}" alt="QR Code" />
```

## Workflow

### Achat de Ticket
1. L'utilisateur achète un ticket
2. Le système génère:
   - Un code unique (UUID)
   - Les données JSON du QR code
   - L'image du QR code en Base64
3. Le ticket est sauvegardé avec les données du QR code
4. Un événement RabbitMQ est publié avec l'image
5. L'email est envoyé avec le QR code visible

### Création d'Abonnement
1. L'utilisateur souscrit à un abonnement via Stripe
2. Le webhook Stripe déclenche la création
3. Le système génère:
   - Un code unique (UUID)
   - Les données JSON du QR code
   - L'image du QR code en Base64
4. L'abonnement est sauvegardé avec les données du QR code
5. Un événement RabbitMQ est publié avec l'image
6. L'email est envoyé avec le QR code visible

### Validation par Contrôleur
1. Le contrôleur scanne le QR code
2. L'application mobile envoie les données à l'API
3. L'API décode le JSON et vérifie:
   - Existence du ticket/abonnement
   - Validité (non expiré, non annulé)
   - Statut (actif, valide)
4. L'API retourne toutes les informations:
   - Validité
   - Informations du passager
   - Type de titre
   - Dates importantes
   - Image du QR code

## Sécurité

- Chaque QR code contient un UUID unique
- Les données sont encodées en JSON
- Les QR codes sont uniques en base de données
- Validation côté serveur obligatoire
- Les images ne sont accessibles qu'après authentification

## Migration

### Tickets Service (MySQL)
```bash
# Le script de migration est automatiquement exécuté par JPA/Hibernate
# Ou manuellement:
mysql -u root -p tickets_db < src/main/resources/db/migration/V1__add_qr_code_image.sql
```

### Subscription Service (SQL Server)
```bash
cd subscription-service
npm install
npm run migrate
```

## Dépendances Ajoutées

### Tickets Service (pom.xml)
```xml
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.3</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.3</version>
</dependency>
```

### Subscription Service (package.json)
```json
"qrcode": "^1.5.4"
```

## Tests

### Tester la génération de QR code
1. Acheter un ticket ou créer un abonnement
2. Vérifier l'email reçu
3. Le QR code doit être visible et scannable

### Tester la validation
1. Scanner le QR code avec une application de scan
2. Copier les données JSON
3. Appeler l'API de validation avec ces données
4. Vérifier la réponse

### Exemple avec curl
```bash
# Valider un ticket
curl -X GET http://localhost:8082/api/tickets/validate-qr/TICKET_QR_DATA

# Valider un abonnement
curl -X GET http://localhost:3002/api/subscriptions/validate-qr/SUBSCRIPTION_QR_DATA
```

## Notes Importantes

1. **Performance**: Les images Base64 peuvent être volumineuses. Considérer une optimisation si nécessaire.
2. **Compatibilité**: Les QR codes sont compatibles avec tous les scanners standard.
3. **Offline**: Les QR codes contiennent toutes les informations nécessaires, mais la validation nécessite une connexion.
4. **Rétrocompatibilité**: Les anciens tickets sans QR code image continuent de fonctionner avec `qrCodeData` uniquement.

## Support

Pour toute question ou problème, consulter:
- Code source: `tickets-service/src/main/java/com/example/ticketsservice/service/BarcodeService.java`
- Code source: `subscription-service/src/services/barcode.service.js`
- Templates email: `notification-service/src/templates/`
