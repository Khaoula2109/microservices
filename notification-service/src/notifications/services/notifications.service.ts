import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService, EmailAttachment } from './email.service';
import { SmsService } from './sms.service';
import { PdfService } from './pdf.service';
import {
    Notification,
    NotificationChannel,
    NotificationStatus,
} from '../schemas/notification.schema';

interface NotificationData {
    userId: string;
    recipient: string;
    channel: NotificationChannel;
    triggerEvent: string;
    payload: Record<string, any>;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
        private readonly emailService: EmailService,
        private readonly smsService: SmsService,
        private readonly pdfService: PdfService,
    ) {}

    async createAndSendNotification(
        data: NotificationData,
    ): Promise<Notification> {
        let subject = '';
        let messageForSms = '';
        let templateName = '';
        const context = data.payload;

        switch (data.triggerEvent) {
            case 'user.registered':
                subject = 'Bienvenue chez Transport Urbain !';
                messageForSms = `Bienvenue chez Transport Urbain, ${context.firstName}! Votre compte est créé.`;
                templateName = 'welcome';
                break;

            case 'subscription.created':
            case 'subscription.renewed':
                subject =
                    data.triggerEvent === 'subscription.created'
                        ? 'Confirmation de votre nouvel abonnement'
                        : 'Votre abonnement a été renouvelé';
                messageForSms = `Votre paiement pour ${context.planName} de ${context.amount} ${context.currency} a été accepté.`;
                templateName = 'subscription-success';
                break;

            case 'bus.delayed':
                subject = `Retard sur la ligne ${context.routeName}`;
                messageForSms = `Votre bus sur la ligne ${context.routeName} a un retard estimé à ${context.delay} minutes.`;
                templateName = 'bus-delayed';
                break;

            case 'ticket.purchased':
                subject = 'Votre ticket de transport';
                messageForSms = `Votre ticket ${context.ticketType} (Code: ${context.qrCodeData}) est prêt. Bon voyage !`;
                templateName = 'ticket-purchased';
                break;

            case 'subscription.payment_failed':
                subject = 'Problème de paiement de votre abonnement';
                messageForSms = `Le paiement de votre abonnement ${context.planName} a échoué. Veuillez mettre à jour vos informations de paiement.`;
                templateName = 'subscription-payment-failed';
                break;

            case 'subscription.canceled':
                subject = 'Votre abonnement a été annulé';
                messageForSms = `Votre abonnement ${context.planName} a été annulé.`;
                templateName = 'subscription-canceled';
                break;

            default:
                this.logger.warn(
                    `Événement non géré pour la notification: ${data.triggerEvent}`,
                );
                throw new Error(
                    `Événement non géré (Unhandled event type): ${data.triggerEvent}`,
                );
        }

        context.subject = subject;
        context.message = messageForSms;

        const notification = new this.notificationModel({
            userId: data.userId,
            recipient: data.recipient,
            channel: data.channel,
            subject: subject,
            content: messageForSms,
            triggerEvent: data.triggerEvent,
            status: NotificationStatus.PENDING,
        });
        await notification.save();
        this.logger.log(
            `Notification ${notification._id} créée pour l'utilisateur ${data.userId} via ${data.channel}.`,
            'NotificationsService',
        );

        try {
            if (data.channel === NotificationChannel.EMAIL) {
                let attachments: EmailAttachment[] | undefined;

                // Generate PDF attachment for ticket purchases
                if (data.triggerEvent === 'ticket.purchased' && context.qrCodeImage) {
                    try {
                        this.logger.log(`Generating PDF ticket for ticket ${context.ticketId}`);
                        const pdfBuffer = await this.pdfService.generateTicketPdf({
                            ticketId: context.ticketId,
                            userId: context.userId,
                            userEmail: data.recipient,
                            ticketType: context.ticketType,
                            purchaseDate: context.purchaseDate,
                            qrCodeImage: context.qrCodeImage,
                        });

                        attachments = [
                            {
                                filename: `ticket-${context.ticketId}.pdf`,
                                content: pdfBuffer,
                                contentType: 'application/pdf',
                            },
                        ];
                        this.logger.log(`PDF ticket generated successfully (${pdfBuffer.length} bytes)`);
                    } catch (pdfError) {
                        this.logger.error(
                            `Failed to generate PDF for ticket ${context.ticketId}: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
                        );
                        // Continue sending email without PDF if generation fails
                    }
                }

                await this.emailService.sendEmail(
                    data.recipient,
                    subject,
                    templateName,
                    context,
                    attachments,
                );
            } else if (data.channel === NotificationChannel.SMS) {
                await this.smsService.sendSms(data.recipient, messageForSms);
            }

            notification.status = NotificationStatus.SENT;
            return await notification.save();
        } catch (error: unknown) {
            let errorMessage = "Erreur inconnue lors de l'envoi de la notification.";
            let errorStack: string | undefined;

            if (error instanceof Error) {
                errorMessage = error.message;
                errorStack = error.stack;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            notification.status = NotificationStatus.FAILED;
            notification.error = {
                message: errorMessage,
                stack: errorStack,
            };
            this.logger.error(
                `Échec de l'envoi de la notification ${String(
                    notification._id,
                )} (Utilisateur: ${data.userId}, Canal: ${data.channel}, Destinataire: ${
                    data.recipient
                }): ${errorMessage}`,
                errorStack,
                'NotificationsService',
            );
            throw error;
        }
    }
}