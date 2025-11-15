const express = require('express');
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbit');
const routes = require('./routes/index.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

connectDB();

connectRabbitMQ()
    .then(() => {
        console.log('✅ Service d\'abonnements prêt (publication et consommation).');
    })
    .catch(err => {
        console.error('❌ Échec critique de la connexion RabbitMQ au démarrage:', err);
        process.exit(1);
    });

app.use(express.json());

app.use('/', routes);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Service d'abonnements démarré sur http://localhost:${port}`);
});