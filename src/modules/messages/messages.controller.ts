import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @Get()
  findMany(@Query() query: QueryMessagesDto) {
    return this.messagesService.findMany(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMessageStatusDto) {
    return this.messagesService.updateStatus(id, dto);
  }
}
