import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Message, MessageStatus } from './entities/message.entity';
import { MessagesRepository } from './repositories/messages.repository.abstract';

@Injectable()
export class InMemoryMessagesRepository extends MessagesRepository {
  private readonly store = new Map<string, Message>();

  async create(content: string, sender: string): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      content,
      sender,
      sentAt: new Date(),
      status: MessageStatus.SENT,
    };
    this.store.set(message.id, message);
    return message;
  }

  async findById(id: string): Promise<Message | undefined> {
    return this.store.get(id);
  }

  async findBySender(sender: string): Promise<Message[]> {
    return Array.from(this.store.values()).filter((m) => m.sender === sender);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    return Array.from(this.store.values()).filter(
      (m) => m.sentAt >= startDate && m.sentAt <= endDate,
    );
  }

  async findAll(): Promise<Message[]> {
    return Array.from(this.store.values());
  }

  async updateStatus(
    id: string,
    status: MessageStatus,
  ): Promise<Message | undefined> {
    const message = this.store.get(id);
    if (!message) return undefined;
    message.status = status;
    return message;
  }
}
