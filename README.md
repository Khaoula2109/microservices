# KowihanTransit - Urban Transportation Management System

[![CI - Build and Push Docker Images](https://github.com/Khaoula2109/microservices/actions/workflows/ci-build.yml/badge.svg)](https://github.com/Khaoula2109/microservices/actions/workflows/ci-build.yml)
[![Deploy to Production](https://github.com/Khaoula2109/microservices/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/Khaoula2109/microservices/actions/workflows/deploy-production.yml)

A comprehensive microservices-based urban transportation management system built with modern cloud-native technologies. The platform enables passengers to purchase tickets, manage subscriptions, track buses in real-time, and receive notifications through multiple channels.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Microservices](#microservices)
- [Technology Stack](#technology-stack)
- [Database Infrastructure](#database-infrastructure)
- [Key Features](#key-features)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
  - [Local Development with Docker Compose](#local-development-with-docker-compose)
  - [Kubernetes Deployment on Minikube](#kubernetes-deployment-on-minikube)
  - [AWS Deployment Considerations](#aws-deployment-considerations)
- [Monitoring & Observability](#monitoring--observability)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## Architecture Overview

KowihanTransit is designed as a **polyglot microservices architecture** leveraging multiple programming languages and databases to best suit each service's specific requirements. The system follows cloud-native principles with containerization, orchestration, and observability built-in from the ground up.

### Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   Ingress       │
                                    │   Controller    │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  API Gateway    │
                                    │  (Port: 8081)   │
                                    │  Spring Cloud   │
                                    └────────┬────────┘
                                             │
                 ┌───────────────────────────┼──────────────────────────┐
                 │                           │                          │
        ┌────────▼────────┐       ┌─────────▼─────────┐     ┌─────────▼─────────┐
        │  User Service   │       │ Tickets Service   │     │ Subscription      │
        │  (Port: 8080)   │       │  (Port: 8082)     │     │ Service           │
        │  Spring Boot    │       │  Spring Boot      │     │ (Port: 3000)      │
        │  PostgreSQL     │       │  MySQL            │     │ Express/MSSQL     │
        └─────────────────┘       └───────────────────┘     └───────────────────┘
                 │
        ┌────────▼────────┐       ┌───────────────────┐     ┌───────────────────┐
        │ Notification    │       │  Routes Service   │     │  Geolocation      │
        │ Service         │       │  (Port: 8083)     │     │  Service          │
        │ (Port: 3001)    │       │  Express          │     │  (Port: 5000)     │
        │ NestJS/MongoDB  │       │  PostgreSQL+GIS   │     │  Flask/Redis      │
        └─────────────────┘       └───────────────────┘     └───────────────────┘
                 │
        ┌────────▼────────┐
        │   RabbitMQ      │
        │ Message Broker  │
        │ (5672, 15672)   │
        └─────────────────┘

                        ┌──────────────────────────────┐
                        │  Monitoring Stack            │
                        │  - Prometheus (Metrics)      │
                        │  - Grafana (Dashboards)      │
                        │  - Jaeger (Tracing)          │
                        └──────────────────────────────┘
```

---

## Microservices

The system consists of **8 core microservices** plus a frontend application:

| Service | Language/Framework | Database | Port | Description |
|---------|-------------------|----------|------|-------------|
| **API Gateway** | Java/Spring Cloud Gateway | Redis | 8081 | Centralized entry point with routing, load balancing, authentication, and rate limiting |
| **User Service** | Java/Spring Boot 3.5.6 | PostgreSQL 17 | 8080 | User authentication, registration, profile management, JWT token handling, and loyalty program |
| **Tickets Service** | Java/Spring Boot 3.5.6 | MySQL 8.0 | 8082 | Ticket purchase, QR code generation/validation, ticket transfers, and refund processing |
| **Subscription Service** | Node.js/Express 5.1 | MSSQL Server | 3000 | Multi-tier subscriptions, Stripe payment integration, and barcode generation |
| **Notification Service** | Node.js/NestJS 11.0 | MongoDB | 3001 | Email, SMS (Twilio), PDF generation, and WebSocket real-time notifications |
| **Routes Service** | Node.js/Express 5.1 | PostgreSQL + PostGIS | 8083 | Geographic route management, stop locations, and route optimization |
| **Geolocation Service** | Python/Flask | Redis | 5000 | Real-time bus tracking, GPS simulation, capacity monitoring, and delay detection |
| **Frontend** | React 18/TypeScript | - | 5173 | Responsive web UI with Vite, TailwindCSS, Leaflet maps, and Socket.io |

---

## Technology Stack

### Backend Technologies

#### Java/Spring Ecosystem
- **Spring Boot** 3.5.6 - 3.5.7
- **Spring Cloud Gateway** - API routing and load balancing
- **Spring Security** - JWT authentication and authorization
- **Spring Data JPA** - Database access layer
- **Spring AMQP** - RabbitMQ integration
- **Resilience4j** - Circuit breaker and fault tolerance
- **ZXing 3.5.3** - QR code generation
- **JJWT 0.11.5** - JWT token handling
- **Lombok** - Code generation
- **Maven** - Build system (Java 21)
- **Micrometer** - Metrics and Prometheus integration
- **OpenTelemetry** - Distributed tracing

#### Node.js/JavaScript
- **NestJS 11.0** - Progressive Node.js framework (Notification Service)
  - **Socket.io** - Real-time WebSocket communication
  - **Nodemailer 7.0** - Email delivery
  - **PDFKit 0.15** - PDF generation
  - **Twilio SDK** - SMS notifications
  - **Mongoose** - MongoDB ORM
  - **Winston 3.18** - Structured logging
- **Express 5.1** - Minimalist web framework (Subscription & Routes)
- **Sequelize 6.37** - SQL ORM for PostgreSQL
- **mssql 12.0** - MSSQL client
- **amqplib 0.10** - RabbitMQ client
- **qrcode 1.5** - QR/Barcode generation

#### Python
- **Flask** - Lightweight WSGI web framework
- **gunicorn** - Production WSGI server
- **Redis client** - In-memory data structure store
- **pika** - RabbitMQ client
- **OpenTelemetry** - Distributed tracing

#### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.5.3** - Type-safe JavaScript
- **Vite 5.4.2** - Fast build tool
- **TailwindCSS 3.4.1** - Utility-first CSS
- **React Router DOM 6.26** - Client-side routing
- **Leaflet 1.9.4** - Interactive maps
- **Socket.io-client 4.7.4** - Real-time communication
- **jsqr 1.4.0** - QR code scanning
- **Supabase JS SDK 2.57** - Backend-as-a-Service client

---

## Database Infrastructure

The system implements **polyglot persistence** with 6 different database technologies optimized for specific use cases:

| Database | Version | Purpose | Service |
|----------|---------|---------|---------|
| **PostgreSQL** | 17 | User profiles, authentication, session management | User Service |
| **MySQL** | 8.0 | Ticket transactions, purchase history | Tickets Service |
| **MSSQL Server** | Latest | Subscription management, billing data | Subscription Service |
| **PostgreSQL + PostGIS** | 15 | Geographic data, routes, stops, spatial queries | Routes Service |
| **MongoDB** | Latest | Notification history, logs, unstructured data | Notification Service |
| **Redis** | 7-Alpine | Caching, session storage, real-time location data | API Gateway, Geolocation Service |

### Message Queue
- **RabbitMQ 3-management** - Event-driven messaging, asynchronous communication (Ports: 5672, 15672)

---

## Key Features

### 1. User Management & Authentication
- **User Registration & Login** - Secure JWT-based authentication
- **Profile Management** - Update personal information and preferences
- **Role-Based Access Control (RBAC)** - Admin, Controller, and Passenger roles
- **Password Management** - Secure password change functionality
- **Loyalty Program** - Points-based reward system:
  - Earn 10 points per ticket purchase
  - Earn 50 points per subscription
  - Redeem points for discounts (Bronze: 5%, Silver: 10%, Gold: 15%)

### 2. Ticket Management
- **Ticket Purchase** - Buy single-ride or day passes
- **QR Code Generation** - Automatic QR code creation using ZXing
- **Ticket Validation** - QR code scanning for controllers
- **Ticket Transfers** - Transfer tickets between users
- **Refund Processing** - Automated refund workflows
- **Purchase History** - Complete transaction history with analytics

### 3. Subscription Management
- **Multi-Tier Subscriptions** - Weekly, monthly, and annual plans
- **Stripe Integration** - Secure payment processing
- **Auto-Renewal** - Automatic subscription renewals
- **Barcode Generation** - Unique subscription QR codes
- **Subscription Analytics** - Usage statistics and insights

### 4. Real-Time Bus Tracking
- **Live GPS Tracking** - Real-time bus location updates every 8 seconds
- **Bus Capacity Monitoring** - Occupied/available seats with visual indicators
- **Delay Detection** - Automatic detection and notification of delays
- **Route Visualization** - Interactive map with Leaflet.js
- **Estimated Arrival Times** - Dynamic ETA calculations

### 5. Multi-Channel Notifications
- **Email Notifications** - Transactional and promotional emails via Nodemailer
- **SMS Notifications** - Critical alerts via Twilio
- **PDF Receipts** - Automated PDF generation for tickets and subscriptions
- **WebSocket Push** - Real-time in-app notifications via Socket.io
- **Notification History** - Persistent storage in MongoDB

### 6. Route Planning
- **Geographic Route Management** - PostGIS-powered spatial queries
- **Stop Management** - Create, update, and delete bus stops
- **Route Optimization** - Efficient path planning
- **Schedule Management** - Timetable creation and updates

### 7. Payment & Billing
- **Payment History** - Complete purchase and subscription history
- **Statistical Analytics** - Total spent, transaction count, spending trends
- **Multi-Payment Methods** - Support for credit cards, debit cards, digital wallets
- **Refund Management** - Automated refund processing

### 8. Admin & Controller Features
- **User Management Dashboard** - Create, update, delete users
- **System Monitoring** - Real-time system health and metrics
- **Controller Dashboard** - Ticket validation interface for operators
- **Analytics & Reporting** - Business intelligence and insights

### 9. Modern Frontend Experience
- **Responsive Design** - Mobile-first UI with TailwindCSS
- **Dark/Light Mode** - Theme switching with context API
- **Multi-Language Support** - Internationalization (i18n)
- **Real-Time Updates** - WebSocket-powered notifications
- **QR Scanner** - Browser-based QR code scanning
- **Interactive Maps** - Leaflet.js integration for route visualization

---

## CI/CD Pipeline

The project implements a **modern CI/CD pipeline** using GitHub Actions with smart change detection and automated deployments.

### 1. Continuous Integration (`ci-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

**Smart Change Detection:**
Uses `dorny/paths-filter` to detect which services have changed and only builds those services, reducing build time and resource consumption.

**Build Process per Service:**

| Service | Build Steps |
|---------|-------------|
| **Java Services** (User, Tickets, API Gateway) | JDK 21 setup → Maven build (`mvn clean package`) → Run tests → Docker build → Push to GHCR |
| **Node.js Services** (Subscription, Notification, Routes) | Node 18 setup → `npm ci` → Run tests/build → Docker build → Push to GHCR |
| **Python Service** (Geolocation) | Python 3.11 setup → `pip install -r requirements.txt` → Docker build → Push to GHCR |
| **Frontend** (React) | Node 18 setup → `npm ci` → `npm run build` → Docker build → Push to GHCR |

**Container Registry:**
- **GitHub Container Registry (GHCR)**: `ghcr.io/khaoula2109/{service-name}:{tag}`
- **Tags**: Commit SHA + `latest`

**Benefits:**
- ✅ Only builds changed services (reduces CI time by 70-80%)
- ✅ Parallel builds for faster execution
- ✅ Automated testing before Docker build
- ✅ Multi-stage Docker builds for optimized images
- ✅ Caching for Maven, npm, and pip dependencies

### 2. Production Deployment (`deploy-production.yml`)

**Trigger:** Manual workflow dispatch

**Target:** AWS EKS (Elastic Kubernetes Service) in `eu-west-1`

**Steps:**
1. Configure AWS credentials
2. Update kubeconfig for EKS cluster
3. Apply Kubernetes manifests:
   - Namespaces (`transport-prod`)
   - Service deployments
4. Verify deployment with `kubectl get pods`

### 3. Infrastructure as Code (`terraform-infrastructure.yml`)

**Actions:** `plan`, `apply`, `destroy` (user-selectable)

**Components:**
- **Terraform 1.6.0** for infrastructure provisioning
- **AWS EKS Cluster** (Kubernetes 1.28)
- **VPC** with public/private subnets
- **Auto-scaling Node Groups** (t3.micro, 1-3 nodes)
- **Managed Add-ons**: CoreDNS, kube-proxy, vpc-cni

---

## Deployment

### Local Development with Docker Compose

The easiest way to run the entire stack locally is using Docker Compose, which orchestrates all 29 services (8 microservices + 6 databases + RabbitMQ + monitoring stack + frontend).

#### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- 8GB+ RAM recommended
- 20GB+ free disk space

#### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Khaoula2109/microservices.git
   cd microservices
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env files for each service
   cp user-service/.env.example user-service/.env
   cp notification-service/.env.example notification-service/.env
   cp subscription-service/.env.example subscription-service/.env
   cp routes-service/.env.example routes-service/.env
   # ... (edit each .env file with your configurations)
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

5. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **API Gateway**: http://localhost:8081
   - **RabbitMQ Management**: http://localhost:15672 (guest/guest)
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3000 (admin/admin123)

6. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f user-service
   ```

7. **Stop all services:**
   ```bash
   docker-compose down

   # Remove volumes (WARNING: deletes all data)
   docker-compose down -v
   ```

---

### Kubernetes Deployment on Minikube

For a production-like Kubernetes environment locally, we deploy to **Minikube** with complete observability and monitoring.

#### Why Minikube?

We opted for local Kubernetes deployment using Minikube due to constraints encountered with AWS free tier (see [AWS Deployment Considerations](#aws-deployment-considerations) below).

#### Prerequisites

- **Minikube** 1.30+
- **kubectl** 1.28+
- **Docker** (as Minikube driver)
- 8GB+ RAM and 4+ CPU cores recommended

#### Quick Start

1. **Start Minikube cluster:**
   ```bash
   cd minikube-deployment
   ./start-minikube.sh
   ```

   This script:
   - Starts Minikube with 4 CPUs and 8GB RAM
   - Enables ingress and metrics-server addons
   - Configures Docker environment

2. **Deploy all services:**
   ```bash
   ./deploy-all.sh
   ```

   This script deploys:
   - Namespaces (`transport-prod`, `transport-databases`)
   - Secrets (database credentials, API keys)
   - Databases (PostgreSQL, MySQL, MSSQL, MongoDB, Redis, RabbitMQ)
   - Microservices (all 8 services)
   - Monitoring stack (Prometheus, Grafana, Jaeger)
   - Ingress rules

3. **Access the application:**

   Add entries to `/etc/hosts`:
   ```bash
   echo "$(minikube ip) kowihan.local api.kowihan.local prometheus.kowihan.local grafana.kowihan.local jaeger.kowihan.local" | sudo tee -a /etc/hosts
   ```

   Access URLs:
   - **Frontend**: http://kowihan.local
   - **API Gateway**: http://api.kowihan.local
   - **Prometheus**: http://prometheus.kowihan.local
   - **Grafana**: http://grafana.kowihan.local (admin/admin123)
   - **Jaeger**: http://jaeger.kowihan.local

   Or use the helper script:
   ```bash
   ./access-app.sh
   ```

4. **Monitor the deployment:**
   ```bash
   # Watch pods
   ./monitor.sh

   # View logs
   ./logs.sh <service-name>

   # Example
   ./logs.sh user-service
   ```

5. **Stop and cleanup:**
   ```bash
   # Stop Minikube
   ./stop-minikube.sh

   # Complete cleanup (delete cluster)
   ./cleanup.sh
   ```

#### Kubernetes Architecture

**Namespaces:**
- `transport-prod` - Microservices and monitoring
- `transport-databases` - Database deployments

**Resources per Service:**
- **Deployment** - Defines pods, replicas, and container specs
- **Service** - Internal load balancing (ClusterIP)
- **ConfigMap** - Non-sensitive configuration
- **Secret** - Sensitive data (database credentials, API keys)
- **PersistentVolumeClaim** - Persistent storage for databases

**Ingress Configuration:**
- Single Ingress controller routing to all services
- Host-based routing (e.g., `api.kowihan.local`, `grafana.kowihan.local`)
- TLS/SSL support (optional)

---

### AWS Deployment Considerations

We initially planned to deploy the entire system on **AWS** using managed services, but encountered several limitations with the **AWS Free Tier** that made it unfeasible for this multi-database microservices architecture.

#### Constraints Encountered

##### 1. Database Limitations

**RDS Free Tier:**
- AWS Free Tier provides **only 1 RDS instance** (750 hours/month)
- Our system requires **6 different database engines**:
  - PostgreSQL (User Service)
  - MySQL (Tickets Service)
  - MSSQL Server (Subscription Service)
  - PostgreSQL + PostGIS (Routes Service)
  - MongoDB
  - Redis

**Specific Issues:**
- **No Amazon DocumentDB Free Tier** - MongoDB-compatible service is paid-only
- **No Amazon ElastiCache Free Tier** - Redis managed service is paid-only
- **MSSQL on RDS** - Requires licensing, significantly more expensive
- **PostGIS extension** - Limited support on RDS for PostgreSQL free tier

**Workaround Attempted:**
We tried running databases on EC2 instances with Docker, but this led to the second constraint.

##### 2. EC2 vCPU Limit

**Free Tier Limit:**
- Default vCPU limit: **8 vCPUs** per region
- Our architecture requirements:
  - 8 microservices × 1 vCPU = 8 vCPUs (minimum)
  - 6 databases × 0.5-1 vCPU = 3-6 vCPUs
  - Monitoring stack (Prometheus, Grafana, Jaeger) = 2-3 vCPUs
  - **Total**: ~15-20 vCPUs needed

**Error Encountered:**
```
Error: creating EC2 Instance: operation error EC2: RunInstances,
https response error StatusCode: 400, RequestID: ...,
api error VcpuLimitExceeded: You have requested more vCPU capacity
than your current vCPU limit of 8 allows for the instance bucket
that the specified instance type belongs to.
```

**Quota Increase:**
While AWS allows requesting a vCPU limit increase, this:
- Requires submitting a support ticket
- Can take 24-48 hours for approval
- Is not guaranteed for free tier accounts
- Defeats the purpose of a free tier deployment

##### 3. Other AWS Limitations

- **EKS Free Tier**: Only the control plane is free (~$0/month), but worker nodes (EC2) count toward compute limits
- **Data Transfer**: Costs accrue quickly with microservices communication
- **Load Balancers**: ALB/NLB not included in free tier ($16-22/month minimum)
- **NAT Gateway**: Required for private subnets, not free ($32-45/month)

#### Why We Chose Minikube

Given the AWS constraints, **local Kubernetes deployment with Minikube** became the most practical solution:

✅ **Full Control**: All 8 services + 6 databases + monitoring stack

✅ **Zero Cost**: Runs entirely on local hardware

✅ **Production-Like**: Real Kubernetes environment, not Docker Compose

✅ **Fast Iteration**: No cloud upload/download times

✅ **Learning Value**: Hands-on Kubernetes experience

✅ **Offline Development**: No internet dependency after initial setup

#### AWS Infrastructure (For Reference)

We maintain **Terraform configurations** in `/infrastructure/terraform/` for future production deployment when budget allows:

- **EKS Cluster** (Kubernetes 1.28)
- **VPC** with public/private subnets
- **Auto-scaling Node Groups** (t3.medium/large recommended)
- **RDS Multi-AZ** for production databases
- **ElastiCache** for Redis
- **DocumentDB** for MongoDB
- **Application Load Balancer**

**Estimated Monthly Cost** (non-free tier): ~$200-400/month

---

## Monitoring & Observability

The system includes a comprehensive observability stack with metrics, logging, and distributed tracing.

### Prometheus - Metrics Collection

**Configuration:** `monitoring/prometheus/prometheus.yml`

**Metrics Endpoints:**
- API Gateway: `http://api-gateway:8081/actuator/prometheus`
- User Service: `http://user-service:8080/actuator/prometheus`
- Tickets Service: `http://tickets-service:8082/actuator/prometheus`
- Routes Service: `http://routes-service:8083/actuator/prometheus`

**Access:**
- **Minikube**: http://prometheus.kowihan.local
- **Port-forward**: `kubectl port-forward svc/prometheus 9090:9090 -n transport-prod`

### Grafana - Visualization

**Pre-configured Dashboards:**
- JVM metrics (heap, threads, GC)
- HTTP request rates and latencies
- Database connection pools
- Custom business metrics

**Access:**
- **Minikube**: http://grafana.kowihan.local
- **Credentials**: admin / admin123
- **Port-forward**: `kubectl port-forward svc/grafana 3000:3000 -n transport-prod`

**Datasources:**
- Prometheus (default)
- Jaeger (for traces)

### Jaeger - Distributed Tracing

**Instrumentation:**
- **Java Services**: OpenTelemetry Java agent
- **Python Services**: OpenTelemetry Python SDK
- **Node.js Services**: OpenTelemetry Node.js SDK

**Trace Example:**
```
[API Gateway] → [User Service] → [PostgreSQL]
                              → [Notification Service] → [MongoDB]
                                                       → [RabbitMQ]
```

**Access:**
- **Minikube**: http://jaeger.kowihan.local
- **Port-forward**: `kubectl port-forward svc/jaeger 16686:16686 -n transport-prod`

### Winston Logging (Notification Service)

**Log Levels:**
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `debug` - Debug information

**Log Format:** JSON structured logs with timestamps and correlation IDs

---

## Getting Started

### Prerequisites

- **Git** 2.30+
- **Docker** 20.10+ & Docker Compose 2.0+
- **Node.js** 18+ (for local frontend development)
- **Java JDK** 21 (for local backend development)
- **Python** 3.11+ (for local geolocation service development)
- **Maven** 3.8+ (for Java services)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Khaoula2109/microservices.git
   cd microservices
   ```

2. **Choose your deployment method:**

   **Option A: Docker Compose (Quickest)**
   ```bash
   docker-compose up -d
   # Wait 2-3 minutes for all services to start
   # Access: http://localhost:5173
   ```

   **Option B: Minikube (Production-like)**
   ```bash
   cd minikube-deployment
   ./start-minikube.sh
   ./deploy-all.sh
   # Wait 3-5 minutes for all pods to be ready
   # Access: http://kowihan.local (after adding to /etc/hosts)
   ```

3. **Verify services are healthy:**
   ```bash
   # Docker Compose
   docker-compose ps

   # Minikube
   kubectl get pods -n transport-prod
   ```

4. **Access the application:**
   - Open http://localhost:5173 (Docker) or http://kowihan.local (Minikube)
   - Register a new user account
   - Start exploring the features!

### First-Time Setup

1. **Create an admin user** (via API):
   ```bash
   curl -X POST http://localhost:8081/api/users/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@kowihan.com",
       "password": "Admin123!",
       "role": "ADMIN"
     }'
   ```

2. **Import sample route data** (optional):
   ```bash
   # Use the provided SQL scripts in routes-service/sample-data/
   ```

3. **Configure notification services** (optional):
   - Set up SMTP credentials in `notification-service/.env` for email
   - Add Twilio credentials for SMS
   - Configure Stripe keys in `subscription-service/.env` for payments

---

## Project Structure

```
microservices/
├── apigateway/                          # Spring Cloud Gateway
│   ├── src/main/java/.../gateway/
│   ├── pom.xml
│   └── Dockerfile
│
├── user-service/                        # User Management & Auth
│   ├── src/main/java/.../user/
│   ├── pom.xml
│   └── Dockerfile
│
├── tickets-service/                     # Ticket Purchase & Validation
│   ├── src/main/java/.../tickets/
│   ├── pom.xml
│   └── Dockerfile
│
├── subscription-service/                # Subscription Management
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── notification-service/                # Multi-Channel Notifications
│   ├── src/notifications/
│   ├── package.json
│   └── Dockerfile
│
├── routes-service/                      # Route Planning & Management
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── geolocation-service/                 # Real-Time Bus Tracking
│   ├── app.py
│   ├── simulator.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── Frontend/project/                    # React Web Application
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml                   # Local development environment
│
├── minikube-deployment/                 # Kubernetes manifests
│   ├── manifests/
│   │   ├── 00-namespaces.yaml
│   │   ├── 01-secrets.yaml
│   │   ├── databases/                  # Database deployments
│   │   ├── microservices/              # Service deployments
│   │   ├── monitoring/                 # Prometheus, Grafana, Jaeger
│   │   └── ingress/                    # Ingress rules
│   ├── start-minikube.sh
│   ├── deploy-all.sh
│   ├── monitor.sh
│   └── cleanup.sh
│
├── infrastructure/                      # AWS Infrastructure as Code
│   ├── terraform/
│   │   ├── eks.tf                      # EKS cluster
│   │   ├── vpc.tf                      # VPC networking
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── kubernetes/
│       └── services/                   # K8s manifests for AWS
│
├── monitoring/                          # Monitoring configurations
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── provisioning/
│       └── dashboards/
│
├── .github/workflows/                   # CI/CD pipelines
│   ├── ci-build.yml                    # Smart Docker builds
│   ├── deploy-production.yml           # AWS EKS deployment
│   ├── deploy-staging.yml
│   └── terraform-infrastructure.yml
│
├── Documentation/                       # Additional guides
│   ├── FEATURES_SUMMARY.md
│   ├── GUIDE_DEPLOIEMENT.md
│   ├── DEMARRAGE_RAPIDE_MINIKUBE.md
│   ├── JAEGER_TRACING_GUIDE.md
│   ├── BARCODE_SYSTEM.md
│   └── TESTS_VALIDATION_TICKETS.md
│
└── README.md                            # This file
```

---

## API Documentation

### Base URLs

- **Local (Docker Compose)**: `http://localhost:8081`
- **Minikube**: `http://api.kowihan.local`
- **AWS (Future)**: `https://api.kowihantransit.com`

### Authentication

All API requests (except `/auth/register` and `/auth/login`) require a JWT token:

```bash
# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","userId":1}

# Use token in subsequent requests
curl -X GET http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Key Endpoints

**User Service (`/api/users`)**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /change-password` - Change password
- `GET /loyalty` - Get loyalty points

**Tickets Service (`/api/tickets`)**
- `POST /purchase` - Purchase ticket
- `GET /` - Get user tickets
- `POST /validate` - Validate QR code
- `POST /transfer` - Transfer ticket
- `POST /refund` - Request refund

**Subscription Service (`/api/subscriptions`)**
- `GET /plans` - List subscription plans
- `POST /subscribe` - Create subscription
- `GET /my-subscriptions` - Get user subscriptions
- `POST /cancel` - Cancel subscription

**Routes Service (`/api/routes`)**
- `GET /` - List all routes
- `GET /:id` - Get route details
- `GET /:id/stops` - Get route stops
- `GET /nearby` - Find nearby stops

**Geolocation Service (`/api/geolocation`)**
- `GET /buses` - Get all bus locations
- `GET /bus/:id` - Get specific bus location
- `GET /bus/:id/capacity` - Get bus capacity
- `WebSocket /ws` - Real-time location updates

### Swagger/OpenAPI Documentation

- **User Service**: http://localhost:8080/swagger-ui.html
- **Tickets Service**: http://localhost:8082/swagger-ui.html
- **API Gateway**: http://localhost:8081/swagger-ui.html

---

## Testing

### Run Tests

**User Service (Java):**
```bash
cd user-service
mvn test
```

**Tickets Service (Java):**
```bash
cd tickets-service
mvn test
```

**Notification Service (Node.js):**
```bash
cd notification-service
npm test
```

**Frontend (React):**
```bash
cd Frontend/project
npm test
```

### Integration Tests

Integration tests are located in each service's `src/test` directory and test inter-service communication.

### Load Testing

Use Apache JMeter or Gatling to load test the API Gateway:
```bash
# Example with wrk
wrk -t12 -c400 -d30s http://localhost:8081/api/tickets
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Compose - Services Not Starting

**Problem:** Containers exit immediately or restart loop

**Solutions:**
```bash
# Check logs
docker-compose logs <service-name>

# Verify environment variables
docker-compose config

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Minikube - Pods in CrashLoopBackOff

**Problem:** Pods failing to start

**Solutions:**
```bash
# Check pod logs
kubectl logs <pod-name> -n transport-prod

# Describe pod for events
kubectl describe pod <pod-name> -n transport-prod

# Check resource limits
kubectl top nodes
kubectl top pods -n transport-prod

# Increase Minikube resources
minikube delete
minikube start --cpus=6 --memory=12288
```

#### 3. Database Connection Issues

**Problem:** Services can't connect to databases

**Solutions:**
```bash
# Verify database pods are running
kubectl get pods -n transport-databases

# Check database logs
kubectl logs <db-pod-name> -n transport-databases

# Test connection from service pod
kubectl exec -it <service-pod> -n transport-prod -- /bin/bash
# Then try: nc -zv postgres-db 5432
```

#### 4. Ingress Not Working

**Problem:** Cannot access services via ingress URLs

**Solutions:**
```bash
# Verify ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress configuration
kubectl get ingress -n transport-prod
kubectl describe ingress kowihan-ingress -n transport-prod

# Verify /etc/hosts entry
cat /etc/hosts | grep kowihan

# Test with port-forward instead
kubectl port-forward svc/api-gateway 8081:8081 -n transport-prod
```

#### 5. Out of Memory Errors

**Problem:** Services crashing due to memory limits

**Solutions:**
```bash
# Increase memory limits in deployment YAML
# For Docker Compose, increase Docker Desktop memory allocation

# Check current memory usage
docker stats
kubectl top pods -n transport-prod
```

---

## Performance Optimization

### Recommendations

1. **Enable Caching:**
   - Redis for API Gateway route caching
   - Redis for frequently accessed user data
   - HTTP caching headers for static assets

2. **Database Indexing:**
   - Add indexes on frequently queried columns
   - Use composite indexes for multi-column queries

3. **Connection Pooling:**
   - Configure HikariCP for Java services
   - Tune pool sizes based on load

4. **Horizontal Scaling:**
   ```bash
   # Scale specific service replicas
   kubectl scale deployment user-service --replicas=3 -n transport-prod
   ```

5. **Resource Limits:**
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

---

## Security

### Best Practices Implemented

✅ **JWT Authentication** - Secure token-based auth

✅ **HTTPS/TLS** - Encrypted communication (production)

✅ **Input Validation** - Prevent injection attacks

✅ **CORS Configuration** - Controlled cross-origin requests

✅ **Rate Limiting** - API Gateway rate limits

✅ **Secret Management** - Kubernetes Secrets, environment variables

✅ **Database Encryption** - Encrypted at rest and in transit

✅ **Role-Based Access Control** - Granular permissions

✅ **Security Headers** - HSTS, CSP, X-Frame-Options

✅ **Dependency Scanning** - Automated vulnerability checks in CI

### Environment Variables

**Never commit secrets!** Use `.env` files (gitignored) or Kubernetes Secrets.

Example `.env` structure:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=users_db
DB_USER=postgres
DB_PASSWORD=<secure-password>

# JWT
JWT_SECRET=<random-256-bit-secret>
JWT_EXPIRATION=86400000

# External Services
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```


---

**Built with ❤️ by the Kowihan Team**
