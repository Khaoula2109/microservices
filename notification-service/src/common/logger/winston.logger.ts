import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private context?: string) {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, context, timestamp, ...metadata }) => {
                const logContext =
                  (context as string) || this.context || 'Application';

                let logMessage: string;
                if (typeof message === 'object' && message !== null) {
                  try {
                    logMessage = JSON.stringify(message);
                  } catch (e) {
                    logMessage = `[Unstringifiable Object: ${String(message)}]`;
                  }
                } else {
                  logMessage = String(message);
                }

                const stringifiedMetadata = Object.keys(metadata).length
                  ? ` ${JSON.stringify(metadata)}`
                  : '';

                return `${String(timestamp)} [${String(logContext)}] ${String(level)}: ${logMessage}${stringifiedMetadata}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, {
      trace: trace ? String(trace) : undefined,
      context: context || this.context,
    });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }
}
