import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envConfig } from './config/env.config';
import { loggerConfig } from './config/logger.config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    LoggerModule.forRoot(loggerConfig),
    AuthModule,
    HealthModule,
    MessagesModule,
  ],
})
export class AppModule {}
