import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './services/notifications.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { RabbitMQConsumerService } from './services/rabbitmq.consumer.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import {
    Notification,
    NotificationSchema,
} from './schemas/notification.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
        ]),
    ],
    controllers: [],
    providers: [
        NotificationsService,
        EmailService,
        SmsService,
        RabbitMQConsumerService,
        NotificationsGateway,
    ],
    exports: [NotificationsGateway],
})
export class NotificationsModule {}