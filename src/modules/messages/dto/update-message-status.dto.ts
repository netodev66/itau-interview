import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MessageStatus } from '../entities/message.entity';

export class UpdateMessageStatusDto {
  @ApiProperty({ enum: MessageStatus, example: MessageStatus.RECEIVED })
  @IsEnum(MessageStatus, {
    message: `status must be one of: ${Object.values(MessageStatus).join(', ')}`,
  })
  status: MessageStatus;
}
