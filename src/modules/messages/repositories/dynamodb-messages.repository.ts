import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_CLIENT } from '../../../database/dynamodb.provider';
import { DynamoDBRepository } from '../../../database/dynamodb.repository';
import { Message, MessageStatus } from '../entities/message.entity';
import { MessagesRepository } from './messages.repository.abstract';

@Injectable()
export class DynamoDBMessagesRepository
  extends DynamoDBRepository
  implements MessagesRepository
{
  protected readonly tableName = process.env.DYNAMODB_TABLE ?? 'Messages';

  private readonly GSI_DATE = 'GSI_DATE';
  private readonly GSI_SENDER = 'GSI_SENDER';

  constructor(@Inject(DYNAMODB_CLIENT) client: DynamoDBDocumentClient) {
    super(client);
  }

  // ------------------------------------------------------------------ writes

  async create(content: string, sender: string): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      content,
      sender,
      sentAt: new Date(),
      status: MessageStatus.SENT,
    };

    await this.putItem({
      PK: this.pk(message.id),
      SK: this.pk(message.id),
      GSI_DATE_PK: this.gsiDatePk(message.sentAt),
      GSI_DATE_SK: this.compositeSort(message.sentAt, message.id),
      GSI_SENDER_PK: this.gsiSenderPk(message.sender),
      GSI_SENDER_SK: this.compositeSort(message.sentAt, message.id),
      id: message.id,
      content: message.content,
      sender: message.sender,
      sentAt: message.sentAt.toISOString(),
      status: message.status,
    });

    return message;
  }

  async updateStatus(
    id: string,
    status: MessageStatus,
  ): Promise<Message | undefined> {
    const item = await this.updateItem({
      key: { PK: this.pk(id), SK: this.pk(id) },
      updateExpression: 'SET #s = :status',
      expressionNames: { '#s': 'status' },
      expressionValues: { ':status': status },
      conditionExpression: 'attribute_exists(id)',
    });
    return item ? this.toEntity(item) : undefined;
  }

  // ------------------------------------------------------------------- reads

  async findById(id: string): Promise<Message | undefined> {
    const item = await this.getItem({ PK: this.pk(id), SK: this.pk(id) });
    return item ? this.toEntity(item) : undefined;
  }

  async findBySender(sender: string): Promise<Message[]> {
    const items = await this.queryItems({
      indexName: this.GSI_SENDER,
      keyCondition: 'GSI_SENDER_PK = :pk',
      expressionValues: { ':pk': this.gsiSenderPk(sender) },
    });
    return items.map(this.toEntity);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    const days = this.getDaysInRange(startDate, endDate);

    const pages = await Promise.all(
      days.map((day) =>
        this.queryItems({
          indexName: this.GSI_DATE,
          keyCondition:
            'GSI_DATE_PK = :pk AND GSI_DATE_SK BETWEEN :start AND :end',
          expressionValues: {
            ':pk': `MESSAGES#${day}`,
            ':start': `${day}T00:00:00.000Z#`,
            ':end': `${day}T23:59:59.999Z#~`,
          },
        }),
      ),
    );

    return pages
      .flat()
      .map(this.toEntity)
      .filter((m) => m.sentAt >= startDate && m.sentAt <= endDate);
  }

  async findAll(): Promise<Message[]> {
    const items = await this.scanItems();
    return items.map(this.toEntity);
  }

  // ------------------------------------------------------------ key builders

  private pk(id: string): string {
    return `MSG#${id}`;
  }

  private gsiDatePk(date: Date): string {
    return `MESSAGES#${date.toISOString().slice(0, 10)}`;
  }

  private gsiSenderPk(sender: string): string {
    return `SENDER#${sender}`;
  }

  /** Shared SK format for GSI_DATE and GSI_SENDER: <ISO timestamp>#<id> */
  private compositeSort(date: Date, id: string): string {
    return `${date.toISOString()}#${id}`;
  }

  private getDaysInRange(start: Date, end: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const last = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    );

    while (cursor <= last) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }

  // --------------------------------------------------------------- mapping

  private toEntity(item: Record<string, unknown>): Message {
    return {
      id: item.id as string,
      content: item.content as string,
      sender: item.sender as string,
      sentAt: new Date(item.sentAt as string),
      status: item.status as MessageStatus,
    };
  }
}
