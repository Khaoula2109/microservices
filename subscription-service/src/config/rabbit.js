// Charger .env SEULEMENT si pas en production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const amqp = require('amqplib');
const { handleUserRegistered } = require('../services/event.handler');

// Construire l'URL RabbitMQ depuis les variables d'environnement
const getRabbitMQUrl = () => {
  // Priorité 1: RABBITMQ_URL ou RABBITMQ_URI
  if (process.env.RABBITMQ_URL) {
    return process.env.RABBITMQ_URL;
  }
  
  if (process.env.RABBITMQ_URI) {
    return process.env.RABBITMQ_URI;
  }
  
  // Priorité 2: Construire depuis les composants
  const host = process.env.RABBITMQ_HOST || 'localhost';
  const port = process.env.RABBITMQ_PORT || '5672';
  const user = process.env.RABBITMQ_USER || 'user';
  const password = process.env.RABBITMQ_PASSWORD || 'password';
  
  return `amqp://${user}:${password}@${host}:${port}`;
};

const RABBITMQ_URI = getRabbitMQUrl();
const EXCHANGE_NAME = 'transport_events';

let connection = null;
let channel = null;

async function connectRabbitMQ() {
    try {
        if (!connection || connection.connection.isClosed()) {
            console.log('🔄 Connexion à RabbitMQ...');
            console.log(`   URL: ${RABBITMQ_URI.replace(/:[^:@]+@/, ':****@')}`);
            
            connection = await amqp.connect(RABBITMQ_URI);
            console.log('✅ Connecté à RabbitMQ (publication et consommation)');

            connection.on('error', (err) => {
                console.error('❌ RabbitMQ Connection Error:', err.message);
                if (!connection.connection.isClosed()) connection.close();
                channel = null;
                setTimeout(connectRabbitMQ, 5000);
            });

            connection.on('close', () => {
                console.warn('⚠️ RabbitMQ Connection Closed. Attempting to reconnect...');
                channel = null;
                setTimeout(connectRabbitMQ, 5000);
            });
        }

        if (!channel) {
            channel = await connection.createChannel();
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
            console.log(`✅ Asserted exchange: ${EXCHANGE_NAME}`);
        }

        await startEventConsumers();
    } catch (error) {
        console.error('❌ Échec de la connexion à RabbitMQ:', error.message);
        console.log('Retrying RabbitMQ connection in 5 seconds...');
        setTimeout(connectRabbitMQ, 5000);
        throw error;
    }
}

function publishEvent(routingKey, eventData) {
    if (!channel) {
        console.error('❌ RabbitMQ channel non disponible, message non envoyé. Tente de reconnecter...');
        connectRabbitMQ().catch(err => console.error("Échec de la reconnexion pour la publication:", err));
        return;
    }

    const payload = Buffer.from(JSON.stringify(eventData));
    channel.publish(EXCHANGE_NAME, routingKey, payload, {
        contentType: 'application/json',
        persistent: true,
    });
    console.log(`📨 ÉVÉNEMENT [${routingKey}] PUBLIÉ :`, eventData);
}

async function startEventConsumers() {
    if (!channel) {
        console.error('Le canal RabbitMQ n\'est pas initialisé pour l\'écoute des consommateurs.');
        return;
    }

    console.log('... Initialisation des consommateurs d\'événements pour le service d\'abonnement ...');

    try {
        const queueName = 'subscription_user_registered_queue';
        await channel.assertQueue(queueName, { durable: true });

        const routingKey = 'user.registered';
        await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

        console.log(`✅ Consommateur configuré pour la queue '${queueName}' avec clé '${routingKey}'.`);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const eventData = JSON.parse(msg.content.toString());
                    console.log(`📨 ÉVÉNEMENT [${routingKey}] REÇU :`, eventData.userId);
                    await handleUserRegistered(eventData);
                    channel.ack(msg);
                } catch (error) {
                    console.error(`❌ Erreur lors du traitement du message ${routingKey}:`, error);
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        console.error(`❌ Erreur lors de la configuration du consommateur 'user.registered':`, error);
    }
}

module.exports = { connectRabbitMQ, publishEvent, startEventConsumers };
