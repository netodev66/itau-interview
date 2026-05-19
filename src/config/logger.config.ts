import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import { Params } from 'nestjs-pino';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

export const loggerConfig: Params = {
  pinoHttp: {
    level: isTest ? 'silent' : isProd ? 'info' : 'debug',
    genReqId: (req: IncomingMessage) =>
      (req.headers['x-request-id'] as string) ?? randomUUID(),
    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.password',
        'req.body.refreshToken',
      ],
      censor: '[REDACTED]',
    },
    transport:
      !isProd && !isTest
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
  },
};
