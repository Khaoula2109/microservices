import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { NotificationsService } from './notifications.service';
import { BusDelayedEventDto } from '../dto/bus-delayed.event';
import { UserRegisteredEventDto} from "../dto/user-registered.event";
import { SubscriptionSuccessEventDto } from '../dto/subscription-success.event.dto';
import { NotificationChannel } from '../schemas/notification.schema';
import { TicketPurchasedEventDto } from '../dto/ticket-purchased.event.dto';
import { SubscriptionStatusChangeEventDto } from '../dto/subscription-status-change.event.dto';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumerService.name);
    private channel: amqp.Channel;
    private readonly exchange: string;
    private readonly dlqExchange: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) {
        const exchangeName = this.configService.get<string>(
            'RABBITMQ_NOTIFICATION_EXCHANGE',
        );
        if (!exchangeName) {
            throw new Error(
                "La variable d'environnement RABBITMQ_NOTIFICATION_EXCHANGE n'est pas définie.",
            );
        }
        this.exchange = exchangeName;
        this.dlqExchange = `${this.exchange}.dlq`;
    }

    async onModuleInit() {
        await this.connectAndConsume();
    }

    private async connectAndConsume() {
        try {
            const RABBITMQ_URI = this.configService.get<string>('RABBITMQ_URI');
            if (!RABBITMQ_URI) {
                throw new Error(
                    "La variable d'environnement RABBITMQ_URI n'est pas définie.",
                );
            }

            const connection = await amqp.connect(RABBITMQ_URI);
            connection.on('error', (err) => {
                this.logger.error(`Erreur de connexion RabbitMQ: ${err.message}`, err.stack);
            });
            connection.on('close', () => {
                this.logger.warn('Connexion RabbitMQ fermée. Tentative de reconnexion...');
                setTimeout(() => this.connectAndConsume(), 5000);
            });

            this.channel = await connection.createChannel();

            this.logger.log('✅ Connecté à RabbitMQ pour la consommation');

            await this.channel.assertExchange(this.exchange, 'topic', {
                durable: true,
            });
            this.logger.log(`Exchange principal '${this.exchange}' assuré.`);
            await this.channel.assertExchange(this.dlqExchange, 'topic', {
                durable: true,
            });
            this.logger.log(`Exchange DLQ '${this.dlqExchange}' assuré.`);

            await this.setupConsumer(
                'notifications_bus_delayed_queue',
                'bus.delayed',
                this.handleBusDelayed.bind(this),
            );

            await this.setupConsumer(
                'notifications_user_registered_queue',
                'user.registered',
                this.handleUserRegistered.bind(this),
            );

            await this.setupConsumer(
                'notifications_subscription_success_queue',
                ['subscription.created', 'subscription.renewed'],
                this.handleSubscriptionEvents.bind(this),
            );

            await this.setupConsumer(
                'notifications_ticket_purchased_queue',
                'ticket.purchased',
                this.handleTicketPurchased.bind(this),
            );

            await this.setupConsumer(
                'notifications_subscription_status_queue',
                ['subscription.payment_failed', 'subscription.canceled'],
                this.handleSubscriptionStatusChange.bind(this),
            );

        } catch (error) {
            this.logger.error(
                `❌ Échec initial de la connexion/configuration RabbitMQ: ${error.message}`,
                error.stack,
            );
            setTimeout(() => this.connectAndConsume(), 5000);
        }
    }

    private async setupConsumer(
        queueName: string,
        routingKey: string | string[],
        handler: (msg: amqp.ConsumeMessage) => Promise<void>,
    ) {
        const dlqQueueName = `${queueName}.dlq`;
        await this.channel.assertQueue(dlqQueueName, { durable: true });

        const keys = Array.isArray(routingKey) ? routingKey : [routingKey];
        for (const key of keys) {
            await this.channel.bindQueue(dlqQueueName, this.dlqExchange, key);
        }
        this.logger.log(
            `DLQ '${dlqQueueName}' liée à l'exchange DLQ '${this.dlqExchange}' pour la/les clé(s) '${keys.join(', ')}'.`,
        );

        await this.channel.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': this.dlqExchange,
            },
        });

        for (const key of keys) {
            await this.channel.bindQueue(queueName, this.exchange, key);
        }

        this.channel.consume(queueName, (msg) => this.messageHandler(msg, handler));
        this.logger.log(
            `Consommateur configuré pour la file: ${queueName} avec la/les clé(s): ${keys.join(', ')}`,
        );
    }

    private async messageHandler(
        msg: amqp.ConsumeMessage | null,
        handler: (msg: amqp.ConsumeMessage) => Promise<void>,
    ) {
        if (msg === null) {
            this.logger.warn('Message reçu null, ignoré.');
            return;
        }

        const correlationId = msg.properties.correlationId || 'N/A';
        const routingKey = msg.fields.routingKey;

        try {
            this.logger.verbose(
                `Traitement du message (ID: ${correlationId}) de la clé: ${routingKey}`,
            );
            await handler(msg);
            this.channel.ack(msg);
            this.logger.verbose(
                `Message (ID: ${correlationId}, Clé: ${routingKey}) acquitté.`,
            );
        } catch (error) {
            this.logger.error(
                `Erreur lors du traitement du message (ID: ${correlationId}, Clé: ${routingKey}): ${
                    error instanceof Error ? error.message : String(error)
                }`,
                error instanceof Error ? error.stack : undefined,
                'RabbitMQConsumerService',
            );
            this.channel.nack(msg, false, false);
            this.logger.warn(
                `Message (ID: ${correlationId}, Clé: ${routingKey}) rejeté (NACK).`,
            );
        }
    }

    private async handleBusDelayed(msg: amqp.ConsumeMessage) {
        const event: BusDelayedEventDto = JSON.parse(msg.content.toString());
        this.logger.log(
            `Événement 'bus.delayed' reçu pour l'utilisateur ${event.userId}.`,
        );

        if (event.userEmail) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.userEmail,
                channel: NotificationChannel.EMAIL,
                triggerEvent: 'bus.delayed',
                payload: event,
            });
        }
        if (event.userPhone) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.userPhone,
                channel: NotificationChannel.SMS,
                triggerEvent: 'bus.delayed',
                payload: event,
            });
        }
    }

    private async handleUserRegistered(msg: amqp.ConsumeMessage) {
        const event: UserRegisteredEventDto = JSON.parse(msg.content.toString());
        this.logger.log(
            `Événement 'user.registered' reçu pour l'utilisateur ${event.userId}.`,
        );

        if (event.email) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.email,
                channel: NotificationChannel.EMAIL,
                triggerEvent: 'user.registered',
                payload: event,
            });
        }
    }

    private async handleSubscriptionEvents(msg: amqp.ConsumeMessage) {
        const event: SubscriptionSuccessEventDto = JSON.parse(
            msg.content.toString(),
        );
        const eventType = msg.fields.routingKey;
        this.logger.log(
            `Événement '${eventType}' reçu pour l'utilisateur ${event.userId}.`,
        );

        if (event.userEmail) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.userEmail,
                channel: NotificationChannel.EMAIL,
                triggerEvent: eventType,
                payload: event,
            });
        }
    }

    private async handleTicketPurchased(msg: amqp.ConsumeMessage) {
        const event: TicketPurchasedEventDto = JSON.parse(msg.content.toString());
        this.logger.log(
            `Événement 'ticket.purchased' reçu pour l'utilisateur ${event.userId}.`,
        );

        if (event.userEmail) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.userEmail,
                channel: NotificationChannel.EMAIL,
                triggerEvent: 'ticket.purchased',
                payload: event,
            });
        }
    }

    private async handleSubscriptionStatusChange(msg: amqp.ConsumeMessage) {
        const event: SubscriptionStatusChangeEventDto = JSON.parse(
            msg.content.toString(),
        );
        const eventType = msg.fields.routingKey;
        this.logger.log(
            `Événement '${eventType}' reçu pour l'utilisateur ${event.userId}.`,
        );

        if (event.userEmail) {
            await this.notificationsService.createAndSendNotification({
                userId: event.userId,
                recipient: event.userEmail,
                channel: NotificationChannel.EMAIL,
                triggerEvent: eventType,
                payload: event,
            });
        }
        // Logique SMS à a jouter !!!
    }
}