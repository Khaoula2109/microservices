#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./logs.sh <service-name> [namespace]"
    echo ""
    echo "Services disponibles:"
    echo "  Databases (namespace: transport-databases):"
    echo "    - postgresql"
    echo "    - postgresql-gis"
    echo "    - mysql"
    echo "    - mssql"
    echo "    - mongodb"
    echo "    - redis"
    echo "    - rabbitmq"
    echo ""
    echo "  Microservices (namespace: transport-prod):"
    echo "    - user-service"
    echo "    - subscription-service"
    echo "    - notification-service"
    echo "    - geolocation-service"
    echo "    - routes-service"
    echo "    - tickets-service"
    echo "    - api-gateway"
    echo "    - frontend"
    echo ""
    echo "Exemples:"
    echo "  ./logs.sh user-service"
    echo "  ./logs.sh postgresql transport-databases"
    exit 1
fi

SERVICE=$1
NAMESPACE=${2:-transport-prod}

POD=$(kubectl get pods -n $NAMESPACE -l app=$SERVICE -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD" ]; then
    echo "❌ Service $SERVICE introuvable dans le namespace $NAMESPACE"
    exit 1
fi

echo "📋 Logs de $SERVICE (Pod: $POD) dans $NAMESPACE"
echo "═══════════════════════════════════════════════════════════════"
kubectl logs -f $POD -n $NAMESPACE
