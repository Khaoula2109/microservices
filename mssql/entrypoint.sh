#!/bin/bash

/opt/mssql/bin/sqlservr &

echo "Attente de 30s pour le démarrage de SQL Server..."
sleep 30s

echo "Exécution du script setup.sql pour créer la base de données..."
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d master -i /usr/src/app/setup.sql

wait