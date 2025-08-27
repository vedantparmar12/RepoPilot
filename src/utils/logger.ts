import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  },
  serializers: {
    error: pino.stdSerializers.err
  }
});

export function createLogger(name: string) {
  return logger.child({ component: name });
}