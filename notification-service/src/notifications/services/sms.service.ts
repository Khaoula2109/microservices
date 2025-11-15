import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
    private readonly twilioClient: Twilio;
    private readonly logger = new Logger(SmsService.name);

    constructor(private readonly configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

        if (!accountSid || !authToken) {
            const msg =
                "Les identifiants Twilio (TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN) ne sont pas configurés dans les variables d'environnement.";
            this.logger.error(msg);
            throw new Error(msg);
        }

        this.twilioClient = new Twilio(accountSid, authToken);
        this.logger.log('Twilio client initialisé.');
    }

    async sendSms(recipientPhone: string, message: string): Promise<void> {
        const fromPhoneNumber = this.configService.get<string>(
            'TWILIO_PHONE_NUMBER',
        );
        if (!fromPhoneNumber) {
            const msg =
                "Le numéro de téléphone Twilio (TWILIO_PHONE_NUMBER) n'est pas configuré dans les variables d'environnement.";
            this.logger.error(msg);
            throw new Error(msg);
        }

        if (!recipientPhone || !recipientPhone.match(/^\+\d{10,15}$/)) {
            const msg = `Numéro de destinataire SMS invalide ou manquant: ${recipientPhone}`;
            this.logger.error(msg);
            throw new Error(msg);
        }


        try {
            this.logger.verbose(`Tentative d'envoi de SMS à ${recipientPhone} depuis ${fromPhoneNumber}.`);
            await this.twilioClient.messages.create({
                from: fromPhoneNumber,
                to: recipientPhone,
                body: message,
            });
            this.logger.log(`SMS envoyé avec succès à ${recipientPhone}.`);
        } catch (error: unknown) {
            let errorMessage = "Erreur inconnue lors de l'envoi du SMS.";
            let errorStack: string | undefined;
            if (error instanceof Error) {
                errorMessage = error.message;
                errorStack = error.stack;
            } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
                errorMessage = error.message;
                errorStack = (error as any).stack;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            this.logger.error(
                `Échec de l'envoi du SMS à ${recipientPhone}: ${errorMessage}`,
                errorStack,
            );
            throw error;
        }
    }
}