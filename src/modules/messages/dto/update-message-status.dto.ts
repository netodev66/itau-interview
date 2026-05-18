import { IsEnum } from 'class-validator';
import { MessageStatus } from '../entities/message.entity';

export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus, {
    message: `status must be one of: ${Object.values(MessageStatus).join(', ')}`,
  })
  status: MessageStatus;
}
