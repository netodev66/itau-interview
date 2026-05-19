import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageStatus } from './entities/message.entity';

const SENDER_UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockMessage = {
  id: 'uuid-1',
  content: 'Hello',
  sender: SENDER_UUID,
  sentAt: new Date('2026-01-01T10:00:00Z'),
  status: MessageStatus.SENT,
};

const mockService: Partial<MessagesService> = {
  create: jest.fn().mockResolvedValue(mockMessage),
  findById: jest.fn().mockResolvedValue(mockMessage),
  findMany: jest.fn().mockResolvedValue([mockMessage]),
  updateStatus: jest
    .fn()
    .mockResolvedValue({ ...mockMessage, status: MessageStatus.READ }),
};

describe('MessagesController', () => {
  let controller: MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockService }],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    jest.clearAllMocks();
  });

  it('create() calls service.create and returns the message', async () => {
    const dto = { content: 'Hello', sender: SENDER_UUID };
    (mockService.create as jest.Mock).mockResolvedValue(mockMessage);

    await expect(controller.create(dto)).resolves.toEqual(mockMessage);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('findOne() calls service.findById with the id param', async () => {
    (mockService.findById as jest.Mock).mockResolvedValue(mockMessage);

    await expect(controller.findOne('uuid-1')).resolves.toEqual(mockMessage);
    expect(mockService.findById).toHaveBeenCalledWith('uuid-1');
  });

  it('findMany() passes query params to service.findMany', async () => {
    (mockService.findMany as jest.Mock).mockResolvedValue([mockMessage]);
    const query = { sender: SENDER_UUID };

    await expect(controller.findMany(query)).resolves.toEqual([mockMessage]);
    expect(mockService.findMany).toHaveBeenCalledWith(query);
  });

  it('updateStatus() passes id and dto to service.updateStatus', async () => {
    const dto = { status: MessageStatus.READ };
    (mockService.updateStatus as jest.Mock).mockResolvedValue({
      ...mockMessage,
      status: MessageStatus.READ,
    });

    const result = await controller.updateStatus('uuid-1', dto);

    expect(result.status).toBe(MessageStatus.READ);
    expect(mockService.updateStatus).toHaveBeenCalledWith('uuid-1', dto);
  });
});
