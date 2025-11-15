const amqp = require('amqplib');
require('dotenv').config();

const RABBITMQ_URI = process.env.RABBITMQ_URI;
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE;

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URI);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        console.log('✅ Connecté à RabbitMQ pour la publication');
    } catch (error) {
        console.error('❌ Échec de la connexion à RabbitMQ:', error.message);
        setTimeout(connectRabbitMQ, 5000);
    }
}

function publishEvent(routingKey, eventData) {
    if (!channel) {
        console.error('RabbitMQ channel non disponible, message non envoyé.');
        return;
    }
    const payload = Buffer.from(JSON.stringify(eventData));
    channel.publish(EXCHANGE_NAME, routingKey, payload, {
        contentType: 'application/json',
        persistent: true,
    });
    console.log(`📨 ÉVÉNEMENT [${routingKey}] PUBLIÉ.`);
}

module.exports = { connectRabbitMQ, publishEvent };