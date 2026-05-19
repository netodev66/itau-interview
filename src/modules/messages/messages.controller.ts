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
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a message' })
  @ApiCreatedResponse({ type: Message })
  @ApiBadRequestResponse({
    description: 'content or sender missing / not a string',
  })
  create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by id' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: Message })
  @ApiNotFoundResponse({ description: 'Message not found' })
  findOne(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List messages by sender or date range' })
  @ApiOkResponse({ type: [Message] })
  @ApiBadRequestResponse({
    description: 'Neither sender nor startDate+endDate provided',
  })
  findMany(@Query() query: QueryMessagesDto) {
    return this.messagesService.findMany(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update message status' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: Message })
  @ApiBadRequestResponse({ description: 'Invalid status value' })
  @ApiNotFoundResponse({ description: 'Message not found' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMessageStatusDto) {
    return this.messagesService.updateStatus(id, dto);
  }
}
