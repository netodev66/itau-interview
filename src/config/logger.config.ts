import { Params } from 'nestjs-pino';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

export const loggerConfig: Params = {
  pinoHttp: {
    level: isTest ? 'silent' : isProd ? 'info' : 'debug',
    transport:
      !isProd && !isTest
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
  },
};
