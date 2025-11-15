import * as amqp from 'amqplib';

const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://user:password@rabbitmq-service:5672';
const EXCHANGE_NAME = process.env.RABBITMQ_NOTIFICATION_EXCHANGE || 'transport_events';

let channel: amqp.Channel | null = null;
let connection: amqp.Connection | null = null;

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(RABBITMQ_URI) as any;
        channel = await connection!.createChannel();
        await channel!.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        console.log('✅ Connecté à RabbitMQ pour les notifications');

        await startEventConsumer();

    } catch (error) {
        console.error('❌ Échec de la connexion à RabbitMQ:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
}

async function startEventConsumer() {
    if (!channel) {
        console.error('Le canal RabbitMQ n\'est pas initialisé pour l\'écoute.');
        return;
    }

    console.log('... Initialisation des consommateurs d\'événements ...');

    try {
        const queueName = 'notifications_user_registered_queue';
        await channel.assertQueue(queueName, { durable: true });

        const routingKey = 'user.registered';
        await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

        channel!.consume(queueName, (msg) => {
            if (msg !== null) {
                try {
                    const eventData = JSON.parse(msg.content.toString());
                    console.log(`📨 ÉVÉNEMENT [${routingKey}] REÇU :`, eventData.userId);

                    handleUserRegistered(eventData);

                    channel!.ack(msg);
                    console.log(`Message '${routingKey}' pour ${eventData.userId} traité et acquitté.`);
                } catch (error) {
                    console.error(`Erreur lors du traitement du message ${routingKey}:`, error);
                    channel!.nack(msg, false, false);
                }
            }
        });

        console.log(`✅ Consommateur configuré pour ${routingKey}`);

    } catch (error) {
        console.error(`Erreur lors de la configuration du consommateur:`, error);
    }
}

function handleUserRegistered(eventData: any) {
    const { userId, email, firstName, lastName } = eventData;
    
    console.log(`🎉 Notification de bienvenue pour ${firstName} ${lastName} (${email})`);
}

connectRabbitMQ();
