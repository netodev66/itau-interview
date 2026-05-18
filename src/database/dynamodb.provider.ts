import { Provider } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const DYNAMODB_CLIENT = 'DYNAMODB_CLIENT';

export const dynamoDBProvider: Provider = {
  provide: DYNAMODB_CLIENT,
  useFactory: () => {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && {
        endpoint: process.env.DYNAMODB_ENDPOINT,
      }),
    });

    return DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  },
};
