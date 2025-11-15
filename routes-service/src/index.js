const express = require('express');
require('dotenv').config();
const db = require('./models');
const scheduleRoutes = require('./routes/scheduleRoutes');
const errorHandler = require('./middleware/errorHandler');
const { connectRabbitMQ } = require('./config/rabbit');

const app = express();
const PORT = process.env.PORT || 8083;

app.use(express.json());

app.use('/api/schedules', scheduleRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Service des trajets et horaires est en ligne.',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Service en fonctionnement',
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} non trouvée`,
        timestamp: new Date().toISOString(),
        code: 404
    });
});


const seedInitialData = async () => {
    try {
        console.log('🌱 Vérification des données initiales...');


        const existingRoutes = await db.Route.count();
        
        if (existingRoutes === 0) {
            console.log('📦 Création des données initiales...');

            
            const stopsData = [
                
                { name: 'Tour Hassan', latitude: 34.020882, longitude: -6.841650 },
                { name: 'Bab Chellah', latitude: 34.013054, longitude: -6.832920 },
                { name: 'Gare Rabat-Ville', latitude: 34.007621, longitude: -6.830150 },
                { name: 'Agdal', latitude: 34.003182, longitude: -6.833500 },
                
                
                { name: 'Cité Universitaire', latitude: 33.971590, longitude: -6.849810 },
                { name: 'ENSIAS', latitude: 33.974400, longitude: -6.853100 },
                { name: 'Hay Ryad', latitude: 33.982300, longitude: -6.859800 },
                
                
                { name: 'Plage de Rabat', latitude: 34.0315, longitude: -6.8400 },
                { name: 'Phare de Rabat', latitude: 34.0250, longitude: -6.8380 },
                { name: 'Bab El Had', latitude: 34.0200, longitude: -6.8360 },
                { name: 'Boulevard Mohammed V', latitude: 34.0150, longitude: -6.8320 },
                
                
                { name: 'Mahaj Ryad', latitude: 33.9700, longitude: -6.8650 },
                { name: 'Prestigia', latitude: 33.9780, longitude: -6.8620 },
                { name: 'Hôpital Cheikh Zayed', latitude: 33.9850, longitude: -6.8600 },
                { name: 'Haut Agdal', latitude: 33.9980, longitude: -6.8450 },
                
                
                { name: 'Qbibat', latitude: 34.0350, longitude: -6.8250 },
                { name: 'Pont Hassan II', latitude: 34.0280, longitude: -6.8240 },
                { name: 'Bab Lamrissa', latitude: 34.0350, longitude: -6.8200 },
                { name: 'Gare de Salé-Ville', latitude: 34.0400, longitude: -6.8150 }
            ];

            const stops = await db.Stop.bulkCreate(stopsData);
            console.log(`✅ ${stops.length} arrêts créés`);

            
            const routesData = [
                { 
                    name: 'BUS-12', 
                    description: 'Tour Hassan ↔ Gare Rabat-Ville ↔ Agdal',
                    startPoint: 'Tour Hassan',
                    endPoint: 'Agdal'
                },
                { 
                    name: 'BUS-07', 
                    description: 'Cité Universitaire ↔ ENSIAS ↔ Hay Ryad',
                    startPoint: 'Cité Universitaire',
                    endPoint: 'Hay Ryad'
                },
                { 
                    name: 'BUS-19', 
                    description: 'Plage de Rabat ↔ Phare ↔ Bab El Had',
                    startPoint: 'Plage de Rabat', 
                    endPoint: 'Boulevard Mohammed V'
                },
                { 
                    name: 'BUS-30', 
                    description: 'Mahaj Ryad ↔ Hôpital Cheikh Zayed ↔ Haut Agdal',
                    startPoint: 'Mahaj Ryad',
                    endPoint: 'Haut Agdal'
                },
                { 
                    name: 'BUS-04', 
                    description: 'Qbibat ↔ Pont Hassan II ↔ Salé-Ville',
                    startPoint: 'Qbibat',
                    endPoint: 'Gare de Salé-Ville'
                }
            ];

            const routes = await db.Route.bulkCreate(routesData);
            console.log(`✅ ${routes.length} lignes créées`);

 
            const routeStopsData = [
                
                { routeId: 1, stopId: 1, stopOrder: 1 },
                { routeId: 1, stopId: 2, stopOrder: 2 },
                { routeId: 1, stopId: 3, stopOrder: 3 },
                { routeId: 1, stopId: 4, stopOrder: 4 },
                
                
                { routeId: 2, stopId: 5, stopOrder: 1 },
                { routeId: 2, stopId: 6, stopOrder: 2 },
                { routeId: 2, stopId: 7, stopOrder: 3 },
                
                
                { routeId: 3, stopId: 8, stopOrder: 1 },
                { routeId: 3, stopId: 9, stopOrder: 2 },
                { routeId: 3, stopId: 10, stopOrder: 3 },
                { routeId: 3, stopId: 11, stopOrder: 4 },
                
                
                { routeId: 4, stopId: 12, stopOrder: 1 },
                { routeId: 4, stopId: 13, stopOrder: 2 },
                { routeId: 4, stopId: 14, stopOrder: 3 },
                { routeId: 4, stopId: 15, stopOrder: 4 },
                
                
                { routeId: 5, stopId: 16, stopOrder: 1 },
                { routeId: 5, stopId: 17, stopOrder: 2 },
                { routeId: 5, stopId: 18, stopOrder: 3 },
                { routeId: 5, stopId: 19, stopOrder: 4 }
            ];

            const routeStops = await db.RouteStop.bulkCreate(routeStopsData);
            console.log(`✅ ${routeStops.length} liaisons route-arrêt créées`);

            console.log('🎉 Données initiales créées avec succès !');
        } else {
            console.log(`📊 Base de données déjà peuplée: ${existingRoutes} lignes existantes`);
        }
    } catch (error) {
        console.error('❌ Erreur lors du peuplement des données:', error);
    }
};

async function startServer() {
    try {
        await Promise.all([
            db.sequelize.sync({ alter: true }),
            connectRabbitMQ()
        ]);

        console.log('Base de données synchronisée.');

        
        await seedInitialData();

        app.listen(PORT, () => {
            console.log(` Service des trajets et horaires démarré sur le port ${PORT}`);
            console.log(` API disponible sur: http://localhost:${PORT}/api/schedules`);
        });
    } catch (error) {
        console.error(' Impossible de démarrer le service:', error);
        process.exit(1);
    }
}

startServer();