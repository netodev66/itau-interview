import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_CLIENT } from '../../../database/dynamodb.provider';

@Injectable()
export class DynamoDBHealthIndicator {
  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly client: DynamoDBDocumentClient,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.client.send(
        new ScanCommand({
          TableName: process.env.DYNAMODB_TABLE ?? 'Messages',
          Limit: 1,
        }),
      );
      return indicator.up();
    } catch {
      return indicator.down({ message: 'DynamoDB unreachable' });
    }
  }
}
