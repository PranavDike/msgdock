import { describe, expect, it, vi } from 'vitest';

import type { Message } from '@msgdock/contracts';

import { InProcessEventBus } from './events.js';
import { MessageValidationError } from './errors.js';
import { MessageService } from './message-service.js';
import type { MessageRepository } from './repository.js';

function createRepository(): MessageRepository {
  return {
    insert: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
  };
}

describe('MessageService', () => {
  it('normalizes, persists, and publishes a created message', async () => {
    const insert = vi.fn();
    const repository: MessageRepository = {
      insert,
      getById: vi.fn(),
      list: vi.fn(),
    };
    const eventBus = new InProcessEventBus();
    const service = new MessageService(repository, eventBus, {
      idGenerator: () => 'msg_generated',
      clock: () => new Date('2026-09-10T10:00:00.000Z'),
    });
    const events: string[] = [];

    eventBus.subscribe('message.created', (event) => {
      events.push(event.message.id);
    });

    const message = await service.create({
      channel: 'email',
      provider: 'smtp',
      from: ' hello@example.com ',
      to: 'developer@example.com',
      subject: ' Hello ',
      body: ' Hello from SMTP.\n',
    });

    expect(message).toEqual({
      id: 'msg_generated',
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Hello',
      body: 'Hello from SMTP.',
      createdAt: '2026-09-10T10:00:00.000Z',
    });
    expect(insert).toHaveBeenCalledWith(message);
    expect(events).toEqual(['msg_generated']);
  });

  it('rejects messages without required routing fields', async () => {
    const service = new MessageService(
      createRepository(),
      new InProcessEventBus(),
      {
        idGenerator: () => 'msg_generated',
        clock: () => new Date(),
      },
    );

    await expect(
      service.create({
        channel: 'email',
        provider: 'smtp',
        from: '',
        to: 'developer@example.com',
        body: 'Body',
      }),
    ).rejects.toBeInstanceOf(MessageValidationError);
  });

  it('delegates list and get operations to the repository', async () => {
    const list = vi.fn();
    const getById = vi.fn();
    const repository: MessageRepository = {
      insert: vi.fn(),
      getById,
      list,
    };
    const message = { id: 'msg_1' } as Message;
    list.mockResolvedValue([message]);
    getById.mockResolvedValue(message);
    const service = new MessageService(repository, new InProcessEventBus(), {
      idGenerator: () => 'msg_generated',
      clock: () => new Date(),
    });

    await expect(service.list({ channel: 'sms' })).resolves.toEqual([message]);
    await expect(service.get('msg_1')).resolves.toEqual(message);
    expect(list).toHaveBeenCalledWith({ channel: 'sms' });
    expect(getById).toHaveBeenCalledWith('msg_1');
  });
});
