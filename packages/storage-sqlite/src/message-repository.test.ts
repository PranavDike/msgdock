import { afterEach, describe, expect, it } from 'vitest';

import type { Message } from '@msgdock/contracts';

import { SQLiteMessageRepository } from './message-repository.js';

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg_1',
    channel: 'email',
    provider: 'smtp',
    status: 'queued',
    from: 'hello@example.com',
    to: 'developer@example.com',
    subject: 'Hello',
    body: 'Body',
    createdAt: '2026-09-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('SQLiteMessageRepository', () => {
  const repositories: SQLiteMessageRepository[] = [];

  afterEach(() => {
    for (const repository of repositories.splice(0)) repository.close();
  });

  it('initializes the schema and persists messages', async () => {
    const repository = new SQLiteMessageRepository(':memory:');
    repositories.push(repository);
    const stored = message();

    await repository.insert(stored);

    await expect(repository.getById(stored.id)).resolves.toEqual(stored);
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('lists messages in deterministic newest-first order with filters and limits', async () => {
    const repository = new SQLiteMessageRepository(':memory:');
    repositories.push(repository);
    await repository.insert(
      message({ id: 'msg_1', createdAt: '2026-09-10T10:00:00.000Z' }),
    );
    await repository.insert(
      message({
        id: 'msg_2',
        channel: 'sms',
        provider: 'twilio',
        status: 'failed',
        createdAt: '2026-09-10T11:00:00.000Z',
      }),
    );
    await repository.insert(
      message({
        id: 'msg_3',
        status: 'delivered',
        createdAt: '2026-09-10T12:00:00.000Z',
      }),
    );

    await expect(repository.list()).resolves.toMatchObject([
      { id: 'msg_3' },
      { id: 'msg_2' },
      { id: 'msg_1' },
    ]);
    await expect(repository.list({ channel: 'email' })).resolves.toMatchObject([
      { id: 'msg_3' },
      { id: 'msg_1' },
    ]);
    await expect(
      repository.list({ status: 'failed', provider: 'twilio', limit: 1 }),
    ).resolves.toMatchObject([{ id: 'msg_2' }]);
  });
});
