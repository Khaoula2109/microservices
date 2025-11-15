import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly mailerService: MailerService) {}

    async sendEmail(
        recipientEmail: string,
        subject: string,
        templateName: string,
        context: Record<string, any>,
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: recipientEmail,
                subject: subject,
                template: `./${templateName}`,
                context: context,
            });
            this.logger.log(
                `Email (template: ${templateName}) envoyé avec succès à ${recipientEmail}`,
            );
        } catch (error: unknown) {
            let errorMessage = "Erreur inconnue lors de l'envoi de l'email.";
            let errorStack: string | undefined;
            if (error instanceof Error) {
                errorMessage = error.message;
                errorStack = error.stack;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            this.logger.error(
                `Erreur lors de l'envoi de l'email à ${recipientEmail}: ${errorMessage}`,
                errorStack,
                'EmailService',
            );
            throw error;
        }
    }
}