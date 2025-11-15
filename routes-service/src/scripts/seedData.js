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


const seedInitialData = async () => {
    try {
        console.log('🌱 RÉINITIALISATION FORCÉE DES DONNÉES...');


        console.log('🧹 Suppression de toutes les données existantes...');
        await db.RouteStop.destroy({ where: {} });
        await db.Schedule.destroy({ where: {} });
        await db.Stop.destroy({ where: {} });
        await db.Route.destroy({ where: {} });

        console.log('✅ Toutes les données supprimées, création des nouvelles données...');


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
            
            { routeId: routes[0].id, stopId: stops[0].id, stopOrder: 1 },
            { routeId: routes[0].id, stopId: stops[1].id, stopOrder: 2 },
            { routeId: routes[0].id, stopId: stops[2].id, stopOrder: 3 },
            { routeId: routes[0].id, stopId: stops[3].id, stopOrder: 4 },
            
            
            { routeId: routes[1].id, stopId: stops[4].id, stopOrder: 1 },
            { routeId: routes[1].id, stopId: stops[5].id, stopOrder: 2 },
            { routeId: routes[1].id, stopId: stops[6].id, stopOrder: 3 },
            
            
            { routeId: routes[2].id, stopId: stops[7].id, stopOrder: 1 },
            { routeId: routes[2].id, stopId: stops[8].id, stopOrder: 2 },
            { routeId: routes[2].id, stopId: stops[9].id, stopOrder: 3 },
            { routeId: routes[2].id, stopId: stops[10].id, stopOrder: 4 },
            
            
            { routeId: routes[3].id, stopId: stops[11].id, stopOrder: 1 },
            { routeId: routes[3].id, stopId: stops[12].id, stopOrder: 2 },
            { routeId: routes[3].id, stopId: stops[13].id, stopOrder: 3 },
            { routeId: routes[3].id, stopId: stops[14].id, stopOrder: 4 },
            
            
            { routeId: routes[4].id, stopId: stops[15].id, stopOrder: 1 },
            { routeId: routes[4].id, stopId: stops[16].id, stopOrder: 2 },
            { routeId: routes[4].id, stopId: stops[17].id, stopOrder: 3 },
            { routeId: routes[4].id, stopId: stops[18].id, stopOrder: 4 }
        ];

        const routeStops = await db.RouteStop.bulkCreate(routeStopsData);
        console.log(`✅ ${routeStops.length} liaisons route-arrêt créées`);

        console.log('🎉 RÉINITIALISATION TERMINÉE ! Données créées avec succès !');

        
        console.log('\n📊 VÉRIFICATION DES DONNÉES:');
        const allRoutes = await db.Route.findAll({ 
            include: [{ 
                model: db.Stop,
                through: { attributes: ['stopOrder'] }
            }] 
        });
        
        allRoutes.forEach(route => {
            console.log(`📍 ${route.name}: ${route.Stops.length} arrêts`);
            route.Stops.forEach(stop => {
                const stopOrder = stop.RouteStop.stopOrder;
                console.log(`   - ${stop.name} (ordre: ${stopOrder})`);
            });
        });

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
    }
};

async function startServer() {
    try {
        console.log('🔄 SYNCHRONISATION FORCÉE - SUPPRESSION DE TOUTES LES DONNÉES...');
        
       
        await db.sequelize.sync({ force: true });

        console.log('✅ Base de données synchronisée et réinitialisée');

        
        await connectRabbitMQ();
        console.log('✅ RabbitMQ connecté');

        
        console.log('🔄 Début du peuplement des données...');
        await seedInitialData();

        
        app.listen(PORT, () => {
            console.log(`🚀 Service des trajets et horaires démarré sur le port ${PORT}`);
            console.log(`📡 API disponible sur: http://localhost:${PORT}/api/schedules`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('💥 Impossible de démarrer le service:', error);
        process.exit(1);
    }
}

