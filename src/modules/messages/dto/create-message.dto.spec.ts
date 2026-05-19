import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMessageDto } from './create-message.dto';

const SENDER_UUID = '550e8400-e29b-41d4-a716-446655440000';

const build = (plain: object) => plainToInstance(CreateMessageDto, plain);

describe('CreateMessageDto', () => {
  it('passes with valid content and sender UUID', async () => {
    const errors = await validate(
      build({ content: 'Hello', sender: SENDER_UUID }),
    );
    expect(errors).toHaveLength(0);
  });

  describe('content', () => {
    it('fails when missing', async () => {
      const errors = await validate(build({ sender: SENDER_UUID }));
      expect(errors.some((e) => e.property === 'content')).toBe(true);
    });

    it('fails when empty string', async () => {
      const errors = await validate(
        build({ content: '', sender: SENDER_UUID }),
      );
      expect(errors.some((e) => e.property === 'content')).toBe(true);
    });

    it('fails when not a string', async () => {
      const errors = await validate(
        build({ content: 123, sender: SENDER_UUID }),
      );
      expect(errors.some((e) => e.property === 'content')).toBe(true);
    });
  });

  describe('sender', () => {
    it('fails when missing', async () => {
      const errors = await validate(build({ content: 'Hello' }));
      expect(errors.some((e) => e.property === 'sender')).toBe(true);
    });

    it('fails when empty string', async () => {
      const errors = await validate(build({ content: 'Hello', sender: '' }));
      expect(errors.some((e) => e.property === 'sender')).toBe(true);
    });

    it('fails when not a valid UUID', async () => {
      const errors = await validate(
        build({ content: 'Hello', sender: 'alice' }),
      );
      expect(errors.some((e) => e.property === 'sender')).toBe(true);
    });

    it('fails when not a string', async () => {
      const errors = await validate(build({ content: 'Hello', sender: 42 }));
      expect(errors.some((e) => e.property === 'sender')).toBe(true);
    });
  });
});
