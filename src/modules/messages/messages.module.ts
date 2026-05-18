import { Module } from '@nestjs/common';
import { dynamoDBProvider } from '../../database/dynamodb.provider';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './repositories/messages.repository.abstract';
import { DynamoDBMessagesRepository } from './repositories/dynamodb-messages.repository';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  providers: [
    MessagesService,
    dynamoDBProvider,
    { provide: MessagesRepository, useClass: DynamoDBMessagesRepository },
  ],
})
export class MessagesModule {}
