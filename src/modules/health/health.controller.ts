import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DynamoDBHealthIndicator } from './indicators/dynamodb.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly dynamodb: DynamoDBHealthIndicator,
  ) {}

  @Get('liveness')
  liveness() {
    return { status: 'ok' };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.dynamodb.isHealthy('dynamodb')]);
  }
}
