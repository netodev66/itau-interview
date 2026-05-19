import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      isGlobal: true,
    }),
    HealthModule,
    MessagesModule,
  ],
})
export class AppModule {}
