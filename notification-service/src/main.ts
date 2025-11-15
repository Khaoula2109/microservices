import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
    const customLogger = new WinstonLogger('NestApp');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: customLogger,
    });

    customLogger.log('Notification service is running and listening for messages...', 'Bootstrap');
}
bootstrap();