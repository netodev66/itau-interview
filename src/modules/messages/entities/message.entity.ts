export enum MessageStatus {
  SENT = 'sent',
  RECEIVED = 'received',
  READ = 'read',
}

export class Message {
  id: string;
  content: string;
  sender: string;
  sentAt: Date;
  status: MessageStatus;
}
