# 🎓 Guide de Présentation pour le Jury - KowihanTransit

## 📋 Table des Matières

1. [Introduction du Projet](#introduction-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Explication Détaillée des Microservices](#explication-détaillée-des-microservices)
4. [Technologies et Outils Clés](#technologies-et-outils-clés)
5. [Plan de Démonstration](#plan-de-démonstration)
6. [Points Forts à Souligner](#points-forts-à-souligner)
7. [Challenges et Solutions](#challenges-et-solutions)

---

## 1. Introduction du Projet

### 🎯 Présentation (2 minutes)

**"Bonjour, je vais vous présenter KowihanTransit, un système de gestion de transport urbain moderne basé sur une architecture microservices."**

### Contexte et Objectifs

**Problématique:**
- Les systèmes de transport urbain traditionnels sont souvent monolithiques
- Difficultés d'évolution et de maintenance
- Manque de temps réel et d'interactivité

**Notre Solution:**
- Plateforme modulaire et évolutive
- Architecture microservices polyglotte (Java, Node.js, Python, React)
- Temps réel pour le tracking des bus
- Notifications multi-canaux (email, SMS, WebSocket)

**Chiffres Clés:**
- 🏗️ **8 microservices** indépendants
- 💾 **6 bases de données** différentes (polyglot persistence)
- 🌐 **4 langages de programmation** (Java, JavaScript/TypeScript, Python, SQL)
- 🔄 **CI/CD automatisé** avec GitHub Actions
- 📊 **Observabilité complète** (Prometheus, Grafana, Jaeger)

---

## 2. Architecture Technique

### 🏛️ Architecture Globale (5 minutes)

#### Schéma à Présenter

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                         │
│              (Web Browser / Mobile)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  INGRESS CONTROLLER                      │
│              (Kubernetes Ingress / nginx)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY                           │
│         (Spring Cloud Gateway - Port 8081)              │
│   • Routage intelligent                                 │
│   • Load balancing                                      │
│   • Authentification JWT                                │
│   • Rate limiting                                       │
│   • Cache Redis                                         │
└──────────┬────────────┬────────────┬─────────────────────┘
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  USER    │  │ TICKETS  │  │  ROUTES  │
    │ SERVICE  │  │ SERVICE  │  │ SERVICE  │
    │          │  │          │  │          │
    │ Spring   │  │ Spring   │  │ Express  │
    │ Boot     │  │ Boot     │  │ Node.js  │
    │ Java 21  │  │ Java 21  │  │          │
    │          │  │          │  │          │
    │ Port     │  │ Port     │  │ Port     │
    │ 8080     │  │ 8082     │  │ 8083     │
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │            │            │
         ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │PostgreSQL│  │  MySQL   │  │PostgreSQL│
    │    17    │  │   8.0    │  │ + PostGIS│
    └──────────┘  └──────────┘  └──────────┘

    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │SUBSCRIPTION│ │NOTIFICATION││GEOLOCATION│
    │ SERVICE  │  │  SERVICE   │ │  SERVICE  │
    │          │  │            │ │           │
    │ Express  │  │  NestJS    │ │  Flask    │
    │ Node.js  │  │  Node.js   │ │  Python   │
    │          │  │            │ │           │
    │ Port     │  │  Port      │ │  Port     │
    │ 3000     │  │  3001      │ │  5000     │
    └────┬─────┘  └─────┬──────┘ └────┬──────┘
         │             │             │
         ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  MSSQL   │  │ MongoDB  │  │  Redis   │
    │  Server  │  │  Latest  │  │  7-Alpine│
    └──────────┘  └──────────┘  └──────────┘

                       ▲
                       │
                ┌──────┴──────┐
                │  RabbitMQ   │
                │ Message Bus │
                │             │
                │ Ports:      │
                │ 5672, 15672 │
                └─────────────┘

┌─────────────────────────────────────────────────────────┐
│              MONITORING & OBSERVABILITY                  │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │Prometheus│   │ Grafana  │   │  Jaeger  │            │
│  │ Metrics  │   │Dashboard │   │ Tracing  │            │
│  └──────────┘   └──────────┘   └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

#### Points Clés à Expliquer

**1. Architecture Microservices**
- Chaque service est **indépendant** et peut être déployé séparément
- Communication via **API REST** et **événements asynchrones** (RabbitMQ)
- Chaque service a sa **propre base de données** (Database per Service pattern)

**2. API Gateway**
- **Point d'entrée unique** pour tous les clients
- **Routage** vers les bons microservices
- **Authentification centralisée** avec JWT
- **Cache Redis** pour améliorer les performances

**3. Polyglot Persistence**
- Chaque service utilise la base de données **la mieux adaptée** à ses besoins:
  - **PostgreSQL** → Données relationnelles (utilisateurs)
  - **MySQL** → Transactions (tickets)
  - **MongoDB** → Documents flexibles (notifications)
  - **Redis** → Cache et données temps réel
  - **PostGIS** → Données géographiques (routes)
  - **MSSQL** → Données d'entreprise (abonnements)

---

## 3. Explication Détaillée des Microservices

### 🔐 User Service (Java/Spring Boot)

**Rôle:** Gestion des utilisateurs et authentification

**Technologies:**
- **Spring Boot 3.5.6**
- **Spring Security** avec JWT
- **PostgreSQL 17**
- **Spring Data JPA**

**Fonctionnalités:**
```
✓ Inscription et connexion
✓ Gestion de profil
✓ Authentification JWT (génération et validation de tokens)
✓ Programme de fidélité (points)
✓ RBAC (Role-Based Access Control)
```

**Points Techniques:**
- **JWT Token:** Génère un token sécurisé à la connexion, valide 24h
- **Hash de mot de passe:** BCrypt pour sécuriser les mots de passe
- **Loyalty Points:** +10 points par ticket, +50 par abonnement
- **Events:** Publie un `UserRegisteredEvent` via RabbitMQ quand un utilisateur s'inscrit

**Base de données:**
```sql
Table: app_users
- id (PRIMARY KEY)
- username
- email
- password (BCrypt hash)
- role (ADMIN, CONTROLLER, USER)
- loyalty_points
- created_at
```

---

### 🎫 Tickets Service (Java/Spring Boot)

**Rôle:** Gestion des tickets de transport

**Technologies:**
- **Spring Boot 3.5.6**
- **MySQL 8.0**
- **ZXing 3.5.3** (génération QR codes)
- **Spring Data JPA**

**Fonctionnalités:**
```
✓ Achat de tickets (simple, journée, semaine)
✓ Génération de QR codes uniques
✓ Validation de QR codes (pour contrôleurs)
✓ Transfert de tickets entre utilisateurs
✓ Remboursements
✓ Historique des achats
```

**Points Techniques:**
- **QR Code Generation:** Utilise ZXing pour créer un QR code unique par ticket
- **Validation:** Vérifie que le QR code n'a pas déjà été utilisé
- **Statuts:** VALID, USED, EXPIRED, REFUNDED
- **Events:** Publie `TicketPurchasedEvent` via RabbitMQ

**Exemple de QR Code:**
```
Format: TICKET-{ticketId}-{userId}-{timestamp}
Encodé en Base64 dans le QR code
```

---

### 📱 Notification Service (Node.js/NestJS)

**Rôle:** Notifications multi-canaux

**Technologies:**
- **NestJS 11.0** (framework progressif Node.js)
- **MongoDB** (historique des notifications)
- **Nodemailer 7.0** (emails)
- **Twilio SDK** (SMS)
- **PDFKit 0.15** (génération PDF)
- **Socket.io** (WebSocket temps réel)
- **Winston 3.18** (logging)

**Fonctionnalités:**
```
✓ Emails transactionnels (confirmation achat, etc.)
✓ SMS critiques (retard bus, annulation)
✓ Génération de PDF (reçus, tickets)
✓ Notifications temps réel via WebSocket
✓ Historique des notifications
```

**Architecture Event-Driven:**
```javascript
// Le service écoute les événements RabbitMQ
RabbitMQ Queue: notifications_queue

Events écoutés:
1. TicketPurchasedEvent → Email + PDF reçu
2. SubscriptionCreatedEvent → Email confirmation
3. BusDelayedEvent → SMS + Push notification
4. TripCancelledEvent → Email + SMS
```

**Points Techniques:**
- **Asynchrone:** Traite les notifications en arrière-plan
- **Retry Logic:** Réessaie l'envoi en cas d'échec
- **Template Engine:** Templates HTML pour les emails
- **PDF Generation:** Génère des reçus au format PDF avec logo et informations

**WebSocket en Temps Réel:**
```typescript
// Les clients se connectent via Socket.io
socket.emit('notification', {
  type: 'BUS_DELAYED',
  message: 'Bus 42 retardé de 15 minutes',
  timestamp: new Date()
});
```

---

### 💳 Subscription Service (Node.js/Express)

**Rôle:** Gestion des abonnements

**Technologies:**
- **Express 5.1**
- **MSSQL Server** (Microsoft SQL Server)
- **Stripe SDK** (paiements)
- **Sequelize ORM**
- **db-migrate** (migrations)

**Fonctionnalités:**
```
✓ Abonnements multi-niveaux (hebdomadaire, mensuel, annuel)
✓ Intégration Stripe pour paiements
✓ Auto-renouvellement
✓ Génération de codes-barres d'abonnement
✓ Historique des paiements
```

**Types d'Abonnements:**
```
1. WEEKLY   → 7 jours   → 15€
2. MONTHLY  → 30 jours  → 50€
3. ANNUAL   → 365 jours → 500€
```

**Points Techniques:**
- **Stripe Integration:** Utilise Stripe Checkout pour paiements sécurisés
- **Webhook Stripe:** Écoute les événements de paiement
- **Barcode Generation:** Génère un QR code unique pour chaque abonnement
- **Events:** Publie `SubscriptionCreatedEvent` via RabbitMQ

---

### 🗺️ Routes Service (Node.js/Express)

**Rôle:** Gestion des itinéraires et arrêts de bus

**Technologies:**
- **Express 5.1**
- **PostgreSQL 15 + PostGIS** (extension géographique)
- **Sequelize ORM**

**Fonctionnalités:**
```
✓ Gestion des routes de bus
✓ Gestion des arrêts (stops)
✓ Calculs de distance géographique
✓ Recherche d'arrêts à proximité
✓ Horaires et planification
```

**PostGIS - Extension Géographique:**
```sql
-- Exemple de requête géospatiale
SELECT stop_name,
       ST_Distance(
         location::geography,
         ST_MakePoint(longitude, latitude)::geography
       ) AS distance
FROM stops
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(longitude, latitude)::geography,
  1000  -- 1km rayon
)
ORDER BY distance;
```

**Points Techniques:**
- **Coordonnées GPS:** Stocke latitude/longitude pour chaque arrêt
- **Calculs Spatiaux:** Utilise PostGIS pour calculer distances, intersections
- **GeoJSON:** Format standard pour données géographiques
- **Intégration Carte:** Fournit données pour affichage sur Leaflet.js

---

### 📍 Geolocation Service (Python/Flask)

**Rôle:** Tracking GPS temps réel des bus

**Technologies:**
- **Flask** (framework web léger)
- **Redis** (stockage temps réel)
- **gunicorn** (serveur WSGI production)
- **OpenTelemetry** (tracing)

**Fonctionnalités:**
```
✓ Simulation GPS des bus (simulator.py)
✓ Mise à jour position toutes les 8 secondes
✓ Suivi de la capacité (places occupées/disponibles)
✓ Détection de retards automatique (delay_detector.py)
✓ API REST pour position temps réel
```

**Architecture Temps Réel:**
```python
# simulator.py - Simule le mouvement des bus
while True:
    for bus in buses:
        # Calcule nouvelle position
        new_position = calculate_next_position(bus)

        # Stocke dans Redis (ultra-rapide)
        redis.set(f'bus:{bus_id}:position', json.dumps({
            'lat': new_position.lat,
            'lng': new_position.lng,
            'speed': bus.speed,
            'occupancy': bus.occupancy
        }))

        # Détecte les retards
        if is_delayed(bus):
            publish_delay_event(bus)

    time.sleep(8)  # Update every 8 seconds
```

**Détection de Retards (delay_detector.py):**
```python
# Compare position réelle vs position attendue
if actual_delay > THRESHOLD_MINUTES:
    # Publie événement RabbitMQ
    publish_event('BusDelayedEvent', {
        'bus_id': bus_id,
        'route': route_name,
        'delay_minutes': actual_delay
    })
    # → Notification Service envoie SMS/Email
```

**Capacité des Bus:**
```
Indicateurs visuels:
🟢 Vert:  0-30% occupé  (beaucoup de places)
🟡 Jaune: 30-70% occupé (moyen)
🔴 Rouge: 70-100% occupé (presque plein)
```

---

### 🚪 API Gateway (Java/Spring Cloud Gateway)

**Rôle:** Point d'entrée unique et orchestration

**Technologies:**
- **Spring Cloud Gateway 3.5.7**
- **Spring Security**
- **Redis** (cache)
- **Resilience4j** (circuit breaker)

**Fonctionnalités:**
```
✓ Routage intelligent vers microservices
✓ Load balancing automatique
✓ Authentification JWT centralisée
✓ Rate limiting (anti-spam)
✓ Cache Redis pour réponses fréquentes
✓ Circuit Breaker (tolérance aux pannes)
✓ CORS configuration
```

**Configuration de Routage:**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: http://user-service:8080
          predicates:
            - Path=/api/users/**
          filters:
            - JwtAuthenticationFilter
            - StripPrefix=1

        - id: tickets-service
          uri: http://tickets-service:8082
          predicates:
            - Path=/api/tickets/**
          filters:
            - JwtAuthenticationFilter
```

**Circuit Breaker:**
```java
// Si tickets-service est down, fallback automatique
@CircuitBreaker(name = "tickets-service", fallbackMethod = "fallbackTickets")
public ResponseEntity<List<Ticket>> getTickets() {
    return ticketsClient.getTickets();
}

public ResponseEntity<List<Ticket>> fallbackTickets(Exception e) {
    return ResponseEntity.ok(getCachedTickets());
}
```

---

### 🎨 Frontend (React/TypeScript)

**Rôle:** Interface utilisateur web

**Technologies:**
- **React 18.3.1**
- **TypeScript 5.5.3**
- **Vite 5.4.2** (build ultra-rapide)
- **TailwindCSS 3.4.1** (styling)
- **React Router DOM 6.26** (navigation)
- **Leaflet 1.9.4** (cartes interactives)
- **Socket.io-client 4.7.4** (WebSocket)
- **jsqr 1.4.0** (scan QR codes)

**Pages Principales:**
```
1. HomePage           → Dashboard principal
2. TicketsPage        → Achat de tickets
3. SubscriptionPage   → Gestion abonnements
4. MapPage            → Carte temps réel des bus (Leaflet)
5. PaymentHistory     → Historique achats
6. ValidateTicket     → Scanner QR (contrôleurs)
7. SchedulesPage      → Horaires
8. RouteSuggestions   → Suggestions itinéraires
9. LoyaltyProgram     → Programme fidélité
```

**Fonctionnalités Avancées:**
- **Responsive Design:** Mobile-first avec TailwindCSS
- **Dark/Light Mode:** Context API pour thème
- **Temps Réel:** Socket.io pour notifications instantanées
- **Carte Interactive:** Leaflet.js avec marqueurs personnalisés
- **QR Scanner:** Utilise la caméra du smartphone pour scanner tickets

**Architecture Frontend:**
```typescript
// Context API pour état global
AuthContext     → Gestion authentification
NotificationContext → Notifications temps réel
ThemeContext    → Dark/Light mode
LanguageContext → Internationalisation

// Services API
api/
  ├── auth.service.ts
  ├── tickets.service.ts
  ├── subscription.service.ts
  └── geolocation.service.ts
```

---

## 4. Technologies et Outils Clés

### 🐰 RabbitMQ - Message Broker (TRÈS IMPORTANT)

**"RabbitMQ est le système nerveux de notre architecture"**

#### Qu'est-ce que RabbitMQ ?

RabbitMQ est un **message broker** qui permet une **communication asynchrone** entre microservices via des **messages**.

#### Pourquoi RabbitMQ ?

**Problème sans RabbitMQ:**
```
User Service achète un ticket
    ↓
Doit ATTENDRE que Notification Service envoie l'email
    ↓
Si Notification Service est lent/down → TOUT BLOQUE
```

**Solution avec RabbitMQ:**
```
User Service achète un ticket
    ↓
Publie message "TicketPurchased" dans RabbitMQ
    ↓
Répond IMMÉDIATEMENT à l'utilisateur ✓
    ↓
(En arrière-plan)
Notification Service lit le message
    ↓
Envoie l'email sans bloquer personne
```

#### Architecture RabbitMQ dans Notre Projet

```
┌─────────────────────────────────────────────────────────┐
│                    RABBITMQ BROKER                       │
│                  (Ports: 5672, 15672)                    │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Exchange:       │  │ Queue:          │              │
│  │ events_exchange │→ │ notifications   │              │
│  └─────────────────┘  └────────┬────────┘              │
│                                 │                        │
└─────────────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌──────────────────┐      ┌──────────────────┐
          │ PUBLISHERS       │      │ CONSUMERS        │
          │ (Envoient)       │      │ (Reçoivent)      │
          │                  │      │                  │
          │ • User Service   │      │ • Notification   │
          │ • Tickets Service│      │   Service        │
          │ • Subscription   │      │                  │
          │   Service        │      │                  │
          │ • Geolocation    │      │                  │
          │   Service        │      │                  │
          └──────────────────┘      └──────────────────┘
```

#### Types de Messages (Events)

**1. UserRegisteredEvent**
```json
{
  "eventType": "USER_REGISTERED",
  "userId": 123,
  "email": "user@example.com",
  "timestamp": "2024-12-02T10:30:00Z"
}
```
→ Notification Service envoie email de bienvenue

**2. TicketPurchasedEvent**
```json
{
  "eventType": "TICKET_PURCHASED",
  "ticketId": 456,
  "userId": 123,
  "ticketType": "SINGLE",
  "amount": 2.50,
  "qrCode": "data:image/png;base64,..."
}
```
→ Notification Service envoie email + PDF du ticket

**3. BusDelayedEvent**
```json
{
  "eventType": "BUS_DELAYED",
  "busId": "BUS-42",
  "routeName": "Ligne 5",
  "delayMinutes": 15,
  "estimatedArrival": "11:15"
}
```
→ Notification Service envoie SMS + notification push

**4. SubscriptionCreatedEvent**
```json
{
  "eventType": "SUBSCRIPTION_CREATED",
  "subscriptionId": 789,
  "userId": 123,
  "plan": "MONTHLY",
  "amount": 50.00
}
```
→ Notification Service envoie confirmation + User Service ajoute points fidélité

#### Configuration RabbitMQ

**Publisher (exemple: Tickets Service):**
```java
@Service
public class TicketEventPublisher {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void publishTicketPurchased(Ticket ticket) {
        TicketPurchasedEvent event = new TicketPurchasedEvent(
            ticket.getId(),
            ticket.getUserId(),
            ticket.getType(),
            ticket.getAmount()
        );

        rabbitTemplate.convertAndSend(
            "events_exchange",      // Exchange
            "ticket.purchased",     // Routing key
            event
        );
    }
}
```

**Consumer (exemple: Notification Service):**
```typescript
@RabbitSubscribe({
  exchange: 'events_exchange',
  routingKey: 'ticket.purchased',
  queue: 'notifications_queue'
})
async handleTicketPurchased(event: TicketPurchasedEvent) {
  // 1. Envoyer email
  await this.emailService.sendTicketPurchaseEmail(event);

  // 2. Générer PDF
  const pdf = await this.pdfService.generateTicketPDF(event);

  // 3. Envoyer notification WebSocket
  this.notificationGateway.sendToUser(event.userId, {
    type: 'TICKET_PURCHASED',
    message: 'Votre ticket a été acheté avec succès'
  });
}
```

#### Avantages de RabbitMQ

```
✓ Asynchrone        → Services ne se bloquent pas
✓ Découplage        → Services indépendants
✓ Fiabilité         → Messages persistés sur disque
✓ Scalabilité       → Peut traiter millions de messages
✓ Retry automatique → Réessaie en cas d'échec
✓ Dead Letter Queue → Messages en erreur isolés
```

#### Management UI

RabbitMQ inclut une interface web de monitoring:
```
URL: http://localhost:15672
Identifiants: guest / guest

On peut voir:
- Nombre de messages en attente
- Rate de publication/consommation
- Queues et exchanges configurés
- Connexions actives
```

---

### 🔍 Jaeger - Distributed Tracing (TRÈS IMPORTANT)

**"Jaeger permet de suivre une requête à travers tous les microservices"**

#### Qu'est-ce que le Distributed Tracing ?

Imaginez qu'un utilisateur achète un ticket. Cette simple action déclenche:

```
1. Frontend → API Gateway
2. API Gateway → User Service (vérifier identité)
3. User Service → PostgreSQL (charger user)
4. API Gateway → Tickets Service (créer ticket)
5. Tickets Service → MySQL (sauvegarder)
6. Tickets Service → RabbitMQ (publier event)
7. Notification Service ← RabbitMQ (recevoir event)
8. Notification Service → MongoDB (log notification)
9. Notification Service → SMTP (envoyer email)
```

**Sans Jaeger:** Impossible de suivre le parcours, debug difficile
**Avec Jaeger:** On voit TOUT le chemin, avec durée de chaque étape

#### Architecture Jaeger dans Notre Projet

```
┌─────────────────────────────────────────────────────────┐
│                    MICROSERVICES                         │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  User    │  │ Tickets  │  │Notification│            │
│  │ Service  │  │ Service  │  │  Service   │            │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘            │
│       │             │              │                    │
│   ┌───▼─────────────▼──────────────▼────┐              │
│   │   OpenTelemetry Java Agent          │              │
│   │   (collecte automatique traces)     │              │
│   └───────────────┬─────────────────────┘              │
│                   │                                     │
└───────────────────┼─────────────────────────────────────┘
                    │ (envoie traces)
                    ▼
        ┌─────────────────────┐
        │   Jaeger Collector  │
        │   (Port: 14268)     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Jaeger Storage    │
        │   (Elasticsearch    │
        │    ou Cassandra)    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Jaeger UI         │
        │   (Port: 16686)     │
        │   Interface Web     │
        └─────────────────────┘
```

#### Comment Nous l'Avons Intégré

**1. Java Services (User, Tickets, API Gateway):**

Ajout dans `pom.xml`:
```xml
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-api</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-spring-boot-starter</artifactId>
</dependency>
```

Configuration `application.yml`:
```yaml
spring:
  application:
    name: user-service

management:
  tracing:
    sampling:
      probability: 1.0  # Trace 100% des requêtes
  otlp:
    endpoint: http://jaeger-collector:4318
```

**2. Python Service (Geolocation):**

```python
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Initialize tracing
tracer = trace.get_tracer(__name__)

# Instrument Flask automatiquement
FlaskInstrumentor().instrument_app(app)

# Traces manuelles pour logique métier
@app.route('/bus/<bus_id>')
def get_bus_location(bus_id):
    with tracer.start_as_current_span("get-bus-location") as span:
        span.set_attribute("bus.id", bus_id)
        location = redis.get(f'bus:{bus_id}:position')
        span.add_event("location-retrieved")
        return jsonify(location)
```

**3. Node.js Services (Notification, Subscription):**

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: 'http://jaeger-collector:14268/api/traces',
  serviceName: 'notification-service'
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();
```

#### Ce que Jaeger Nous Montre

**Exemple de Trace "Achat Ticket":**

```
Trace ID: a1b2c3d4e5f6g7h8
Total Duration: 487ms

Span 1: api-gateway [GET /api/tickets/purchase]
├─ Duration: 487ms
├─ Status: OK
│
├── Span 2: user-service [GET /api/users/me]
│   ├─ Duration: 45ms
│   ├─ Database Query: SELECT * FROM users WHERE id = ?
│   └─ DB Duration: 12ms
│
├── Span 3: tickets-service [POST /api/tickets]
│   ├─ Duration: 215ms
│   │
│   ├── Span 4: Generate QR Code
│   │   └─ Duration: 89ms
│   │
│   ├── Span 5: Save to MySQL
│   │   └─ Duration: 34ms
│   │
│   └── Span 6: Publish to RabbitMQ
│       └─ Duration: 12ms
│
└── Span 7: notification-service [Send Email]
    ├─ Duration: 178ms
    ├── Span 8: Generate PDF
    │   └─ Duration: 67ms
    └── Span 9: SMTP Send
        └─ Duration: 98ms
```

**Visualisation dans Jaeger UI:**

```
Timeline View:
|-------- api-gateway (487ms) ----------|
  |-- user-service (45ms) --|
            |-------- tickets-service (215ms) --------|
                     |-- QR Gen (89ms) --|
                                  |-- MySQL (34ms) --|
                                            |-- RMQ (12ms) --|
                                                     |---- notification (178ms) ----|
```

#### Fonctionnalités Jaeger

**1. Service Map (Carte des Services)**
```
Visualise les dépendances entre services:

Frontend → API Gateway → User Service → PostgreSQL
                       ↓
                   Tickets Service → MySQL
                                   → RabbitMQ
                       ↓
                   Notification Service → MongoDB
                                        → SMTP
```

**2. Recherche de Traces**
- Par service
- Par opération (GET /api/tickets)
- Par durée (> 500ms pour trouver lenteurs)
- Par tag (user_id, error=true)

**3. Analyse de Performance**
```
Questions que Jaeger répond:
- Quelle étape est la plus lente ?
- Combien de requêtes DB par requête HTTP ?
- Y a-t-il des appels inutiles ?
- Où se produisent les erreurs ?
```

**4. Détection d'Erreurs**
```
Si une trace a une erreur, Jaeger montre:
- À quelle étape l'erreur s'est produite
- Le message d'erreur exact
- Le contexte (paramètres, utilisateur, etc.)
```

#### Cas d'Usage Pratique

**Scénario:** Les utilisateurs se plaignent que l'achat de tickets est lent

**Investigation avec Jaeger:**
1. Chercher toutes les traces `POST /api/tickets/purchase`
2. Filtrer celles > 1 seconde
3. Analyser la timeline
4. Découverte: `Generate QR Code` prend 850ms !
5. Solution: Optimiser la génération de QR, passer à 50ms
6. Résultat: Achat passe de 1.2s à 400ms

---

### 📊 Prometheus & Grafana - Monitoring

#### Prometheus (Collecte de Métriques)

**Configuration (`prometheus.yml`):**
```yaml
scrape_configs:
  - job_name: 'user-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['user-service:8080']

  - job_name: 'tickets-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['tickets-service:8082']
```

**Métriques Collectées:**
```
Métriques Système:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

Métriques JVM (Java):
- Heap memory
- Garbage Collection
- Thread count
- Class loading

Métriques HTTP:
- Request count
- Response time (p50, p95, p99)
- Error rate
- Throughput

Métriques Business:
- Tickets vendus / minute
- Revenus / heure
- Utilisateurs actifs
- Bus en retard
```

**Requêtes PromQL:**
```promql
# Taux de requêtes HTTP par seconde
rate(http_requests_total[5m])

# Latence moyenne des requêtes
http_request_duration_seconds_sum / http_request_duration_seconds_count

# Taux d'erreur
rate(http_requests_total{status="500"}[5m]) / rate(http_requests_total[5m])

# Memory usage
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}
```

#### Grafana (Visualisation)

**Dashboards Créés:**

```
1. Overview Dashboard
   - Total requests/sec (tous services)
   - Error rate global
   - Average response time
   - Active users

2. Service Health Dashboard
   - Status de chaque microservice (UP/DOWN)
   - CPU/Memory par service
   - Request rate par service

3. Business Metrics Dashboard
   - Tickets vendus aujourd'hui
   - Revenus du jour
   - Top 5 routes utilisées
   - Programme fidélité: points distribués

4. Database Dashboard
   - Connection pool usage
   - Query performance
   - Slow queries (> 1s)

5. RabbitMQ Dashboard
   - Messages published/sec
   - Queue depth
   - Consumer lag
```

**Alertes Configurées:**
```yaml
alerts:
  - name: HighErrorRate
    expr: rate(http_requests_total{status="500"}[5m]) > 0.05
    message: "Taux d'erreur > 5% sur {{ $labels.service }}"

  - name: ServiceDown
    expr: up == 0
    message: "Service {{ $labels.job }} is DOWN"

  - name: HighLatency
    expr: http_request_duration_seconds{quantile="0.95"} > 1
    message: "95% des requêtes > 1s sur {{ $labels.service }}"
```

---

### 🐳 Docker & Kubernetes

#### Docker Compose (Développement Local)

**Fichier `docker-compose.yml` (29 services):**
```yaml
version: '3.8'

services:
  # Databases
  postgres-db:
    image: postgres:17
    environment:
      POSTGRES_USER: kowihan
      POSTGRES_PASSWORD: password
      POSTGRES_DB: user_db
    ports: ["5432:5432"]
    networks: [transport-net]

  mysql-db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: tickets_db
    ports: ["3306:3306"]

  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI

  # Microservices
  user-service:
    build: ./user-service
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-db:5432/user_db
      RABBITMQ_HOST: rabbitmq
    depends_on:
      - postgres-db
      - rabbitmq

  # Monitoring
  prometheus:
    image: prom/prometheus:v2.47.0
    ports: ["9090:9090"]
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:10.1.0
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin123
```

**Commandes:**
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f user-service

# Arrêter tout
docker-compose down

# Rebuild un service
docker-compose build user-service
docker-compose up -d user-service
```

#### Kubernetes (Production)

**Architecture Kubernetes:**
```
Namespaces:
├── transport-prod (microservices)
└── transport-databases (bases de données)

Pour chaque service:
├── Deployment (définit les pods)
├── Service (load balancer interne)
├── ConfigMap (configuration)
└── Secret (credentials)
```

**Exemple: User Service Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: transport-prod
spec:
  replicas: 2  # 2 instances pour haute disponibilité
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:postgresql://postgres-db:5432/user_db
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: postgres-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: transport-prod
spec:
  selector:
    app: user-service
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

**Ingress (Point d'entrée externe):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kowihan-ingress
  namespace: transport-prod
spec:
  rules:
  - host: kowihan.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 5173

  - host: api.kowihan.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8081
```

---

### 🔄 CI/CD avec GitHub Actions

**Pipeline CI/CD complet:**

```
┌─────────────────────────────────────────────────────────┐
│                     DÉVELOPPEUR                          │
│                git push → main branch                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS (CI)                         │
│                                                          │
│  1. Detect Changes (dorny/paths-filter)                 │
│     → Vérifie quels services ont changé                 │
│                                                          │
│  2. Build Changed Services (parallel)                   │
│     ├─ Java: Maven build + tests                        │
│     ├─ Node.js: npm ci + build                          │
│     └─ Python: pip install + lint                       │
│                                                          │
│  3. Docker Build & Push                                 │
│     → ghcr.io/khaoula2109/{service}:{commit-sha}        │
│                                                          │
│  4. Security Scan (optionnel)                           │
│     → Trivy scan for vulnerabilities                    │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            DEPLOYMENT (Manuel ou Auto)                   │
│                                                          │
│  Minikube (Local):                                      │
│    kubectl apply -f minikube-deployment/manifests/      │
│                                                          │
│  AWS EKS (Production):                                  │
│    1. Configure AWS credentials                         │
│    2. Update kubeconfig                                 │
│    3. kubectl apply -f infrastructure/kubernetes/       │
│    4. Verify deployment                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Smart Change Detection:**
```yaml
# Ne build QUE les services modifiés
detect-changes:
  runs-on: ubuntu-latest
  outputs:
    user-service: ${{ steps.filter.outputs.user-service }}
    tickets-service: ${{ steps.filter.outputs.tickets-service }}
  steps:
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          user-service:
            - 'user-service/**'
          tickets-service:
            - 'tickets-service/**'

build-user-service:
  needs: detect-changes
  if: needs.detect-changes.outputs.user-service == 'true'
  # Build uniquement si user-service a changé
```

**Bénéfices:**
```
✓ CI < 10 minutes (au lieu de 30+)
✓ Économie de ressources GitHub Actions
✓ Feedback rapide aux développeurs
✓ Déploiement incrémental possible
```

---

## 5. Plan de Démonstration (15-20 minutes)

### 🎬 Scénario de Démonstration Complet

#### Préparation (avant la démo)

```bash
# 1. Vérifier que tout est UP
kubectl get pods -n transport-prod

# 2. Ouvrir les URLs dans des onglets
- http://kowihan.local (Frontend)
- http://prometheus.kowihan.local (Prometheus)
- http://grafana.kowihan.local (Grafana)
- http://jaeger.kowihan.local (Jaeger)
- http://localhost:15672 (RabbitMQ Management)

# 3. Préparer un utilisateur de test
curl -X POST http://api.kowihan.local/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@test.com","password":"Demo123!"}'
```

---

### 🎯 Partie 1: Vue d'Ensemble Architecture (3 min)

**Script:**

> "Notre système KowihanTransit est basé sur une architecture microservices moderne. Nous avons 8 services indépendants qui communiquent via un API Gateway et RabbitMQ."

**Montrer:**
1. **Schéma architecture** (slide ou diagram.net)
2. **Dashboard Grafana** "Overview"
   - Montrer tous les services UP
   - Requêtes/sec en temps réel
   - Taux d'erreur à 0%

**Points à mentionner:**
```
✓ 8 microservices indépendants
✓ 6 bases de données différentes (polyglot persistence)
✓ Communication asynchrone via RabbitMQ
✓ Monitoring complet avec Prometheus/Grafana
✓ Distributed tracing avec Jaeger
```

---

### 🎯 Partie 2: Parcours Utilisateur Complet (5 min)

**Scénario:** Un utilisateur achète un ticket

#### Étape 1: Inscription/Connexion (1 min)

**Action:**
```
1. Aller sur http://kowihan.local
2. Cliquer "S'inscrire"
3. Remplir formulaire
4. Montrer la redirection après inscription
```

**Montrer en parallèle:**
- **RabbitMQ Management UI**: Message `UserRegisteredEvent` publié
- **MongoDB Compass**: Nouvelle notification créée
- **Terminal**: Logs Notification Service

**Expliquer:**
> "Quand l'utilisateur s'inscrit, le User Service publie un événement dans RabbitMQ. Le Notification Service reçoit cet événement et envoie automatiquement un email de bienvenue. Tout ça de manière asynchrone, l'utilisateur n'attend pas."

#### Étape 2: Achat de Ticket (2 min)

**Action:**
```
1. Se connecter avec le compte créé
2. Aller dans "Acheter un Ticket"
3. Sélectionner "Ticket Simple" - 2.50€
4. Confirmer l'achat
5. Montrer le QR code généré
```

**Montrer en parallèle:**

**A. Jaeger UI (onglet séparé):**
```
1. Aller dans Jaeger
2. Service: "api-gateway"
3. Operation: "POST /api/tickets/purchase"
4. Cliquer "Find Traces"
5. Sélectionner la trace la plus récente
```

**Montrer la timeline:**
```
Timeline View montrera:
├─ API Gateway (authentification JWT)
├─ User Service (vérifier solde/compte)
├─ Tickets Service
│  ├─ Generate QR Code
│  ├─ Save to MySQL
│  └─ Publish RabbitMQ event
└─ Notification Service
   ├─ Generate PDF
   └─ Send Email
```

**Expliquer:**
> "Avec Jaeger, on voit exactement le chemin de la requête. L'API Gateway vérifie le JWT, appelle User Service pour valider l'utilisateur, puis Tickets Service crée le ticket et génère le QR code. En parallèle, Notification Service envoie l'email avec le PDF."

**B. Grafana Dashboard:**
```
Montrer le graphique "Tickets Sold" qui augmente en temps réel
Montrer "Revenue" qui s'incrémente
```

**C. Programme Fidélité:**
```
1. Aller dans "Programme Fidélité"
2. Montrer que l'utilisateur a gagné +10 points
3. Expliquer le système (100pts = 5%, 250pts = 10%, 500pts = 15%)
```

#### Étape 3: Validation de Ticket (Contrôleur) (1 min)

**Action:**
```
1. Ouvrir une fenêtre incognito (pour jouer le rôle contrôleur)
2. Se connecter avec compte contrôleur
3. Aller dans "Valider Ticket"
4. Scanner le QR code (ou entrer manuellement)
5. Montrer "Ticket VALID" ✓
6. Rescanner le même → Montrer "Ticket ALREADY USED" ❌
```

**Expliquer:**
> "Le système empêche la réutilisation. Une fois validé, le statut change dans MySQL et une seconde validation est refusée."

#### Étape 4: Abonnement (1 min)

**Action:**
```
1. Aller dans "Abonnements"
2. Choisir "Abonnement Mensuel" - 50€
3. Cliquer "Souscrire"
4. (Simuler paiement Stripe ou skip si sandbox)
5. Montrer l'abonnement actif avec QR code
```

**Montrer:**
- Programme Fidélité: +50 points ajoutés
- RabbitMQ: `SubscriptionCreatedEvent` publié
- Email de confirmation reçu

---

### 🎯 Partie 3: Tracking Temps Réel des Bus (3 min)

**Action:**
```
1. Aller sur la page "Carte"
2. Montrer les bus qui bougent en temps réel
3. Cliquer sur un bus
4. Montrer la popup avec:
   - Numéro de bus
   - Route
   - Capacité (ex: 45/60 - jaune)
   - Vitesse
   - ETA prochain arrêt
```

**Montrer en parallèle:**

**A. Terminal - Geolocation Service logs:**
```bash
kubectl logs -f deployment/geolocation-service -n transport-prod
```
**On voit:**
```
[INFO] Bus BUS-42 updated: lat=48.8566, lng=2.3522, occupancy=75%
[INFO] Bus BUS-15 updated: lat=48.8606, lng=2.3376, occupancy=30%
```

**B. Redis Commander (optionnel):**
```
Montrer les clés Redis:
bus:BUS-42:position → {"lat":48.8566,"lng":2.3522,"occupancy":75}
```

**C. Détection de Retard:**
```bash
# Dans un terminal séparé, simuler un retard
curl -X POST http://api.kowihan.local/api/geolocation/bus/BUS-42/delay \
  -H "Content-Type: application/json" \
  -d '{"delayMinutes": 15}'
```

**Résultat:**
```
1. RabbitMQ: BusDelayedEvent publié
2. Notification Service: SMS + Email envoyé
3. Frontend: Notification toast apparaît
4. Bus devient rouge sur la carte
```

**Expliquer:**
> "Le service Geolocation en Python met à jour les positions toutes les 8 secondes dans Redis. Le frontend récupère ces données via WebSocket pour affichage temps réel. Si un retard est détecté, un événement est publié dans RabbitMQ et tous les utilisateurs concernés reçoivent une notification."

---

### 🎯 Partie 4: Monitoring et Observabilité (4 min)

#### A. Prometheus Metrics (1 min)

**Action:**
```
1. Ouvrir Prometheus UI
2. Aller dans "Graph"
3. Exécuter ces requêtes:
```

**Requête 1: Taux de requêtes**
```promql
rate(http_requests_total[5m])
```
**Montrer:** Graphique avec requêtes/sec par service

**Requête 2: Latence P95**
```promql
histogram_quantile(0.95, http_request_duration_seconds_bucket)
```
**Montrer:** 95% des requêtes en < 500ms

**Requête 3: Taux d'erreur**
```promql
rate(http_requests_total{status="500"}[5m])
```
**Montrer:** 0 erreur = système stable

#### B. Grafana Dashboards (2 min)

**Dashboard 1: Service Health**
```
Montrer:
✓ Tous les services UP (8/8)
✓ CPU < 50% sur tous
✓ Memory < 70% sur tous
✓ Response time < 500ms
```

**Dashboard 2: Business Metrics**
```
Montrer:
📊 Tickets vendus aujourd'hui: 47
💰 Revenue: 523.50€
🚌 Bus actifs: 12
👥 Utilisateurs actifs: 23
⭐ Points fidélité distribués: 1,250
```

**Dashboard 3: RabbitMQ**
```
Montrer:
📨 Messages/sec: 12
📥 Queue depth: 0 (tout consommé)
✓ No consumer lag
```

**Expliquer:**
> "Grafana nous donne une vue temps réel de la santé du système. On peut voir les métriques techniques (CPU, mémoire) mais aussi les métriques business (revenue, tickets vendus). Les alertes sont configurées pour nous prévenir si quelque chose va mal."

#### C. Jaeger Tracing Avancé (1 min)

**Action:**
```
1. Aller dans Jaeger
2. Cliquer "Service Map"
3. Montrer la carte des dépendances
```

**Expliquer le graphe:**
```
Frontend → API Gateway
            ├→ User Service → PostgreSQL
            ├→ Tickets Service → MySQL → RabbitMQ
            ├→ Subscription Service → MSSQL
            └→ Routes Service → PostgreSQL+PostGIS

RabbitMQ → Notification Service → MongoDB
                                → SMTP
                                → Twilio
```

**Recherche de trace lente:**
```
1. Search traces
2. Max Duration: 1s
3. Show only slow traces
4. Analyser pourquoi c'est lent
```

**Expliquer:**
> "Si les utilisateurs se plaignent de lenteur, Jaeger nous aide à identifier immédiatement quelle étape pose problème. On peut voir si c'est la base de données, un appel externe, ou la génération de QR code."

---

### 🎯 Partie 5: Résilience et Scalabilité (2 min)

#### Démonstration Circuit Breaker (optionnel si temps)

**Action:**
```bash
# Simuler la panne d'un service
kubectl scale deployment tickets-service --replicas=0 -n transport-prod

# Essayer d'acheter un ticket depuis l'interface
# → Montrer le fallback gracieux
```

**Résultat:**
```
Au lieu de planter, l'API Gateway:
1. Détecte que tickets-service est down
2. Active le circuit breaker
3. Retourne une réponse de fallback:
   "Service temporairement indisponible, veuillez réessayer"
```

**Remettre le service:**
```bash
kubectl scale deployment tickets-service --replicas=2 -n transport-prod
```

#### Démonstration Scalabilité

**Action:**
```bash
# Scaler un service horizontalement
kubectl scale deployment user-service --replicas=4 -n transport-prod

# Montrer les nouveaux pods
kubectl get pods -n transport-prod | grep user-service
```

**Expliquer:**
> "Avec Kubernetes, on peut facilement augmenter le nombre d'instances d'un service si la charge augmente. C'est du scaling horizontal automatique. L'API Gateway distribue automatiquement le trafic entre toutes les instances."

---

### 🎯 Partie 6: CI/CD (2 min)

**Montrer GitHub Actions:**

**Action:**
```
1. Aller sur GitHub → Actions tab
2. Montrer un workflow récent
3. Expliquer les étapes:
```

**Workflow Steps:**
```
1. ✓ Detect Changes (12s)
   → dorny/paths-filter identifie user-service modifié

2. ✓ Build user-service (2m 34s)
   ├─ Set up JDK 21
   ├─ Maven build + tests
   └─ Docker build & push to GHCR

3. ⏭️ Skip autres services (non modifiés)

4. ✓ Total: 3m 12s (au lieu de 15m+ si tous les services)
```

**Montrer un déploiement:**
```bash
# Montrer l'historique Git
git log --oneline | head -10

# Montrer les images Docker
docker images | grep ghcr.io/khaoula2109
```

**Expliquer:**
> "Notre CI/CD est intelligent. Il ne build que les services qui ont changé, ce qui économise du temps et des ressources. Une fois l'image Docker créée, on peut la déployer sur n'importe quel environnement: local, staging, ou production."

---

## 6. Points Forts à Souligner

### 🌟 Points Techniques Avancés

#### 1. Architecture Microservices Polyglotte
```
✓ Java pour services métier critiques (User, Tickets)
  → Typage fort, performance, écosystème Spring mature

✓ Node.js pour I/O intensif (Notification, Subscription)
  → Event loop efficace, async/await naturel

✓ Python pour calculs et scripts (Geolocation)
  → Syntaxe simple, librairies scientifiques

✓ React/TypeScript pour UI moderne
  → Composants réutilisables, type-safety
```

**Pourquoi c'est impressionnant:**
> "Nous avons choisi le meilleur outil pour chaque tâche au lieu de forcer tout dans un seul langage. Cela montre notre maturité technique et notre capacité à intégrer des technologies hétérogènes."

#### 2. Event-Driven Architecture avec RabbitMQ
```
✓ Communication asynchrone
✓ Découplage des services
✓ Fiabilité (messages persistés)
✓ Scalabilité (millions de messages)
```

**Pourquoi c'est impressionnant:**
> "RabbitMQ nous permet de construire un système résilient où les services ne dépendent pas les uns des autres. Si le service de notification est down, les tickets peuvent quand même être achetés."

#### 3. Observabilité Complète (Monitoring, Logging, Tracing)
```
Prometheus → Métriques (what is happening)
Grafana → Visualisation (see the data)
Jaeger → Tracing (why it's happening)
```

**Pourquoi c'est impressionnant:**
> "En production, le monitoring est aussi important que le code lui-même. Avec notre stack d'observabilité, on peut diagnostiquer n'importe quel problème en quelques minutes."

#### 4. Polyglot Persistence
```
PostgreSQL    → Relations + ACID
MySQL         → Transactions rapides
MongoDB       → Flexibilité schéma
Redis         → Performance extrême
PostGIS       → Requêtes géospatiales
MSSQL         → Intégration enterprise
```

**Pourquoi c'est impressionnant:**
> "Chaque service utilise la base de données optimale pour ses besoins. C'est le principe 'Database per Service' des microservices."

#### 5. CI/CD Intelligent
```
✓ Smart change detection
✓ Parallel builds
✓ Automated testing
✓ Container registry
✓ GitOps workflow
```

**Pourquoi c'est impressionnant:**
> "Notre pipeline CI/CD détecte automatiquement quels services ont changé et ne build que ceux-là. Cela réduit le temps de build de 70% et économise des ressources."

---

### 🎯 Points Métier

#### 1. Fonctionnalités Temps Réel
```
✓ Tracking GPS des bus (8s updates)
✓ Notifications WebSocket instantanées
✓ Détection automatique de retards
✓ Affichage capacité en temps réel
```

#### 2. Multi-Canal Notifications
```
✓ Email (confirmations, reçus)
✓ SMS (alertes critiques)
✓ Push notifications (temps réel)
✓ PDF (reçus téléchargeables)
```

#### 3. Programme de Fidélité
```
✓ Points automatiques (10 par ticket, 50 par abonnement)
✓ 3 niveaux de récompense (Bronze, Silver, Gold)
✓ Réductions progressives (5%, 10%, 15%)
```

#### 4. Sécurité
```
✓ JWT authentication
✓ BCrypt password hashing
✓ HTTPS/TLS (production)
✓ RBAC (Role-Based Access Control)
✓ Rate limiting
✓ Input validation
```

---

## 7. Challenges et Solutions

### 🚧 Défis Rencontrés

#### Challenge 1: Déploiement AWS

**Problème:**
```
Essayé de déployer sur AWS mais:
❌ AWS Free Tier = 1 seul RDS (on en a besoin de 6)
❌ Pas d'Amazon DocumentDB gratuit (MongoDB)
❌ Pas d'ElastiCache gratuit (Redis)
❌ Limite vCPU: 8 vCPUs (on a besoin de ~15-20)

Erreur reçue:
VcpuLimitExceeded: You have requested more vCPU capacity
than your current vCPU limit of 8 allows
```

**Solution:**
```
✓ Déploiement local avec Minikube
✓ Environnement Kubernetes complet
✓ Même architecture qu'en production
✓ Coût: 0€
✓ Performance: excellente (local = plus rapide)
```

**Ce qu'on a appris:**
> "Cette contrainte nous a forcés à mieux comprendre Kubernetes et à optimiser notre architecture. En production avec budget, on pourrait facilement migrer vers EKS/GKE."

#### Challenge 2: Gestion de la Complexité Microservices

**Problème:**
```
❌ 8 services = 8 bases de données à gérer
❌ Difficulté de tracer les erreurs inter-services
❌ Gestion des dépendances entre services
```

**Solution:**
```
✓ Jaeger pour tracing distribué
✓ Standardisation des logs (JSON format)
✓ Health checks sur tous les services
✓ Circuit breakers avec Resilience4j
✓ Documentation complète de l'architecture
```

#### Challenge 3: Synchronisation des Horloges

**Problème:**
```
❌ Timestamps incohérents entre services
❌ Ordre des événements RabbitMQ incorrect
```

**Solution:**
```
✓ Utilisation d'UTC partout
✓ NTP synchronization
✓ Correlation IDs dans tous les logs
```

#### Challenge 4: Gestion des Transactions Distribuées

**Problème:**
```
Scénario: Achat ticket
1. User Service débite 2.50€
2. Tickets Service crée ticket
3. (CRASH) Notification Service fail

Résultat: Argent débité mais pas de notification
```

**Solution:**
```
✓ Pattern Saga (compensating transactions)
✓ Idempotence des APIs
✓ Event sourcing pour historique complet
✓ Retry logic avec exponential backoff
```

---

## 8. Questions Possibles du Jury et Réponses

### Q1: "Pourquoi avez-vous choisi une architecture microservices plutôt qu'un monolithe?"

**Réponse:**
> "Pour un système de transport urbain, nous avons plusieurs raisons:
>
> 1. **Scalabilité indépendante:** Le tracking GPS (geolocation) reçoit beaucoup plus de requêtes que le service d'abonnements. Avec des microservices, je peux scaler uniquement geolocation-service.
>
> 2. **Technologie adaptée:** Le tracking temps réel est plus efficace en Python avec Redis, tandis que les transactions de tickets sont mieux en Java avec MySQL.
>
> 3. **Résilience:** Si le service de notifications est down, les utilisateurs peuvent quand même acheter des tickets. Dans un monolithe, tout tomberait.
>
> 4. **Équipes indépendantes:** En entreprise, différentes équipes peuvent travailler sur différents services sans se bloquer mutuellement.
>
> 5. **Déploiements indépendants:** Je peux déployer une mise à jour du service tickets sans toucher aux autres services."

---

### Q2: "RabbitMQ vs REST API: pourquoi utiliser les deux?"

**Réponse:**
> "Ce sont deux modèles complémentaires:
>
> **REST API (synchrone):**
> - Quand on a BESOIN de la réponse immédiatement
> - Exemple: 'Est-ce que ce ticket est valide?' → Besoin réponse OUI/NON maintenant
>
> **RabbitMQ (asynchrone):**
> - Quand la réponse peut attendre
> - Exemple: 'Envoyer un email de confirmation' → Pas besoin d'attendre que l'email soit envoyé
>
> **Avantage RabbitMQ:**
> - Si Notification Service est down, le message reste dans la queue
> - Quand il revient UP, il traite tous les messages en attente
> - Avec REST, si le service est down → échec direct
>
> **Cas d'usage mixte:**
> Achat ticket:
> 1. API Gateway → Tickets Service (REST, besoin réponse)
> 2. Tickets Service → RabbitMQ (asynchrone, notification)
> 3. Notification Service ← RabbitMQ (lit et traite)"

---

### Q3: "Comment gérez-vous la sécurité?"

**Réponse:**
> "Sécurité multi-niveaux:
>
> **1. Authentification:**
> - JWT tokens (JSON Web Tokens)
> - Expiration 24h
> - Signature HMAC SHA-256
>
> **2. Autorisation:**
> - RBAC (Role-Based Access Control)
> - 3 rôles: USER, CONTROLLER, ADMIN
> - Middleware vérifie permissions pour chaque endpoint
>
> **3. Mots de passe:**
> - BCrypt avec salt (jamais en clair)
> - Force minimale requise (8 caractères, maj, chiffre)
>
> **4. Communication:**
> - HTTPS/TLS en production
> - Certificats SSL pour ingress
>
> **5. Kubernetes:**
> - Secrets pour credentials
> - Network policies (isolation des namespaces)
> - RBAC Kubernetes pour admin
>
> **6. API Gateway:**
> - Rate limiting (max 100 req/min par IP)
> - CORS configuré strictement
> - Input validation
>
> **7. Bases de données:**
> - Credentials dans Kubernetes Secrets
> - Parameterized queries (anti-SQL injection)
> - Principe du moindre privilège (chaque service = compte DB dédié)"

---

### Q4: "Que se passe-t-il si un service tombe en panne?"

**Réponse:**
> "Plusieurs mécanismes de résilience:
>
> **1. Health Checks:**
> ```yaml
> livenessProbe:  # Kubernetes redémarre si échec
>   httpGet:
>     path: /actuator/health
>     port: 8080
>   periodSeconds: 10
> ```
>
> **2. Circuit Breaker (Resilience4j):**
> - Si un service est down, on ouvre le circuit
> - On retourne une réponse de fallback
> - On réessaie périodiquement
>
> **3. Retry Logic:**
> - Tentatives automatiques avec exponential backoff
> - 3 essais: 2s, 4s, 8s
>
> **4. Multiple Replicas:**
> - Chaque service = 2+ pods
> - Load balancing automatique
> - Si un pod crash, les autres continuent
>
> **5. RabbitMQ:**
> - Messages persistés sur disque
> - Si consumer est down, messages attendent
> - Pas de perte de données
>
> **6. Monitoring:**
> - Alertes automatiques si service down
> - Grafana dashboard montre statut en temps réel
> - PagerDuty/Slack pour notifications équipe
>
> **Exemple concret:**
> ```
> Notification Service crash
> → Kubernetes détecte (health check fail)
> → Nouveau pod démarré automatiquement (30s)
> → Messages RabbitMQ en attente traités
> → Aucune notification perdue
> ```"

---

### Q5: "Comment testez-vous le système?"

**Réponse:**
> "Stratégie de tests multi-niveaux:
>
> **1. Tests Unitaires:**
> ```java
> @Test
> void testTicketPurchase() {
>     Ticket ticket = ticketService.purchase(userId, TicketType.SINGLE);
>     assertNotNull(ticket.getQrCode());
>     assertEquals(TicketStatus.VALID, ticket.getStatus());
> }
> ```
> - Chaque service: 70%+ code coverage
> - JUnit 5 (Java), Jest (Node.js), pytest (Python)
>
> **2. Tests d'Intégration:**
> - Testcontainers pour bases de données
> - Simule RabbitMQ avec testcontainers
> - Teste communication entre services
>
> **3. Tests End-to-End:**
> ```javascript
> it('should purchase ticket and receive email', async () => {
>   const response = await api.post('/tickets/purchase');
>   expect(response.status).toBe(200);
>   await waitFor(() => {
>     expect(emailService.getSentEmails()).toHaveLength(1);
>   });
> });
> ```
>
> **4. Tests de Charge:**
> - Apache JMeter ou Gatling
> - Simule 1000 utilisateurs simultanés
> - Vérifie temps de réponse < 500ms
>
> **5. Tests de Chaos Engineering:**
> - Chaos Monkey (kill random pods)
> - Vérifie que système reste stable
>
> **6. CI/CD:**
> - Tests automatiques sur chaque commit
> - Pull request bloquée si tests échouent"

---

### Q6: "Quelles sont les prochaines améliorations?"

**Réponse:**
> "Roadmap technique et fonctionnelle:
>
> **Court terme (3 mois):**
> - GraphQL API (plus flexible que REST)
> - Application mobile (React Native)
> - Cache distribué (Redis Cluster)
> - Elasticsearch pour recherche avancée
>
> **Moyen terme (6 mois):**
> - Machine Learning pour prédiction de retards
> - Chatbot pour support client
> - Paiement contactless NFC
> - Intégration Google Maps API
>
> **Long terme (1 an):**
> - Service Mesh (Istio) pour communication inter-services
> - Multi-tenant (plusieurs villes)
> - Blockchain pour tickets infalsifiables
> - Edge computing pour tracking GPS
> - Analyse prédictive de la fréquentation
>
> **Infrastructure:**
> - Migration vers AWS EKS (avec budget)
> - Auto-scaling avancé (HPA + VPA)
> - Multi-region pour haute disponibilité
> - CDN pour assets frontend (CloudFront)
> - Backup automatisé (Velero)"

---

### Q7: "Pourquoi avoir choisi ces technologies spécifiques?"

**Réponse détaillée par technologie:**

**Java/Spring Boot:**
> "Pour User Service et Tickets Service car:
> - Transactions financières = besoin typage fort
> - Écosystème Spring très mature (Security, Data JPA, Cloud)
> - Performance excellente pour API REST
> - Support enterprise de longue durée"

**Node.js/NestJS:**
> "Pour Notification Service car:
> - I/O intensif (emails, SMS, WebSocket)
> - Event loop parfait pour async
> - NestJS = architecture propre (inspirée d'Angular)
> - Intégration facile Socket.io"

**Python/Flask:**
> "Pour Geolocation Service car:
> - Calculs géospatiaux (librairies scientifiques)
> - Scripts de simulation simples
> - Flask = léger et rapide"

**PostgreSQL:**
> "Pour User Service car:
> - Relations complexes (users, roles, permissions)
> - ACID stricte pour données critiques
> - JSON support (flexible)"

**MySQL:**
> "Pour Tickets Service car:
> - Excellente performance pour lectures/écritures
> - Transactions rapides
> - Popularité = beaucoup de ressources"

**MongoDB:**
> "Pour Notification Service car:
> - Schéma flexible (différents types de notifications)
> - Pas besoin de migrations
> - Excellente performance pour logs"

**Redis:**
> "Pour Geolocation et API Gateway car:
> - Performance extrême (< 1ms)
> - Structure de données riches (GEO commands)
> - Cache parfait"

**RabbitMQ:**
> "vs Kafka car:
> - Plus simple pour commencer
> - Pattern pub/sub + routing flexible
> - Management UI excellent
> - (Kafka serait mieux pour volumes massifs)"

---

## 9. Conseils de Présentation

### ⏱️ Gestion du Temps

```
0-3min:   Introduction + Architecture overview
3-8min:   Démo parcours utilisateur complet
8-12min:  Monitoring (Prometheus/Grafana/Jaeger)
12-15min: CI/CD + Résilience
15-20min: Questions du jury
```

### 🎯 Langage Corporel & Élocution

```
✓ Parler clairement et pas trop vite
✓ Regarder tous les membres du jury alternativement
✓ Utiliser des gestes pour accompagner explications
✓ Montrer votre enthousiasme pour le projet
✓ Sourire (montre confiance)
```

### 💡 Techniques de Présentation

**1. Storytelling:**
> Ne pas dire: "J'ai fait un microservice"
> Dire: "Les utilisateurs avaient besoin d'acheter des tickets rapidement, j'ai donc créé..."

**2. Montrer, ne pas dire:**
> Au lieu d'expliquer RabbitMQ 5 minutes, montrer un message dans la queue en 30 secondes

**3. Anticipez les questions:**
> Intégrez les réponses dans la présentation
> Exemple: "Vous vous demandez peut-être pourquoi pas AWS? Voici la raison..."

**4. Vulgarisez sans condescendre:**
> "RabbitMQ, c'est comme la poste: on dépose un message, il sera livré même si le destinataire n'est pas là"

### 🚨 Gestion des Problèmes Techniques

**Si quelque chose ne marche pas pendant la démo:**

```
Option 1: Avoir des screenshots/vidéos de backup
Option 2: Expliquer ce qui devrait se passer
Option 3: Montrer les logs pour expliquer le problème
Option 4: "C'est justement pour ça qu'on a Jaeger/Prometheus!"
```

**Phrase magique:**
> "C'est exactement le genre de problème que notre système de monitoring nous aide à diagnostiquer rapidement."

---

## 10. Checklist Pré-Démo

### ✅ Technique

```
□ Minikube démarré
□ Tous les pods UP (kubectl get pods -n transport-prod)
□ Frontend accessible (http://kowihan.local)
□ API Gateway accessible (http://api.kowihan.local)
□ Prometheus UP (http://prometheus.kowihan.local)
□ Grafana UP + dashboards loadés
□ Jaeger UP (http://jaeger.kowihan.local)
□ RabbitMQ Management UP (http://localhost:15672)
□ Compte utilisateur test créé
□ Compte contrôleur créé
□ Quelques données de test (tickets, bus en mouvement)
□ Batterie laptop chargée à 100%
□ Internet stable (si besoin)
□ Backup: screenshots/vidéos des fonctionnalités
```

### ✅ Présentation

```
□ Slides préparés (architecture, schémas)
□ README.md à jour et imprimé
□ Diagrammes d'architecture imprimés
□ Notes de présentation (bullet points)
□ Timing répété (< 15 minutes pour démo)
□ Questions anticipées préparées
□ Tenue professionnelle
□ Repos (bien dormir la veille)
```

### ✅ Matériel

```
□ Laptop chargé + chargeur
□ Souris (plus facile que trackpad)
□ Adaptateur HDMI/VGA (si projecteur)
□ Câble ethernet (si WiFi instable)
□ Clé USB avec backup du projet
□ Eau (pour la gorge)
□ Chronomètre/montre visible
```

---

## 11. Script Complet de Présentation

### Introduction (2 minutes)

> "Bonjour, je suis [votre nom] et je vais vous présenter **KowihanTransit**, un système complet de gestion de transport urbain moderne.
>
> **Contexte:** Les systèmes de transport traditionnels sont souvent monolithiques, difficiles à faire évoluer et manquent d'interactivité. Nous avons voulu créer une solution moderne, scalable et temps réel.
>
> **Notre solution** est basée sur une architecture microservices avec **8 services indépendants**, **6 bases de données différentes**, le tout orchestré par Kubernetes avec une observabilité complète.
>
> Voici l'architecture générale..."

[Montrer le schéma d'architecture]

> "Nous avons:
> - Un **API Gateway** comme point d'entrée unique
> - Des **microservices** en Java, Node.js et Python
> - **RabbitMQ** pour la communication asynchrone
> - Une stack de **monitoring** complète: Prometheus, Grafana, Jaeger
> - Une **interface web React** responsive
>
> Passons maintenant à la démonstration."

---

### Conclusion (1 minute)

> "En résumé, KowihanTransit démontre:
>
> ✓ Une architecture microservices moderne et scalable
> ✓ Une communication événementielle avec RabbitMQ
> ✓ Une observabilité complète pour la production
> ✓ Des fonctionnalités temps réel avancées
> ✓ Un CI/CD intelligent et automatisé
>
> Ce projet m'a permis de maîtriser:
> - L'architecture distribuée à grande échelle
> - Le déploiement Kubernetes
> - L'intégration de technologies hétérogènes
> - Les patterns avancés (Circuit Breaker, Event Sourcing, CQRS)
>
> Je suis prêt à répondre à vos questions. Merci de votre attention."

---

## 📚 Ressources Supplémentaires

### Documentation Technique
- README.md principal (ce document)
- Code source commenté
- Diagrammes architecture (draw.io)

### Pour Approfondir
- Martin Fowler: "Microservices" (martinfowler.com)
- "Building Microservices" de Sam Newman
- Documentation Spring Cloud
- Kubernetes documentation officielle

---

**Bonne chance pour votre présentation! 🚀**

*N'oubliez pas: vous connaissez votre projet mieux que quiconque. Soyez confiant, passionné et précis dans vos explications.*
