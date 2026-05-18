import { Message, MessageStatus } from '../entities/message.entity';

export abstract class MessagesRepository {
  abstract create(content: string, sender: string): Promise<Message>;
  abstract findById(id: string): Promise<Message | undefined>;
  abstract findBySender(sender: string): Promise<Message[]>;
  abstract findByDateRange(startDate: Date, endDate: Date): Promise<Message[]>;
  abstract findAll(): Promise<Message[]>;
  abstract updateStatus(
    id: string,
    status: MessageStatus,
  ): Promise<Message | undefined>;
}
