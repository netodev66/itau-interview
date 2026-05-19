import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DynamoDBHealthIndicator } from './indicators/dynamodb.health-indicator';
import { dynamoDBProvider } from '../../database/dynamodb.provider';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DynamoDBHealthIndicator, dynamoDBProvider],
})
export class HealthModule {}
