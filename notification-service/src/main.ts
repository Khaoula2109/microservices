import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
    const customLogger = new WinstonLogger('NestApp');

    const app = await NestFactory.create(AppModule, {
        logger: customLogger,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    customLogger.log(`Notification service is running on port ${port} and listening for messages...`, 'Bootstrap');
}
bootstrap();