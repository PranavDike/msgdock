import { afterEach, describe, expect, it } from 'vitest';

import type { Message } from '@msgdock/contracts';
import {
  InProcessEventBus,
  MessageService,
  type MessageRepository,
} from '@msgdock/core';

import { SmsServerAdapter } from './sms-server.js';

describe('SmsServerAdapter', () => {
  const adapters: SmsServerAdapter[] = [];

  afterEach(async () => {
    await Promise.all(adapters.splice(0).map((adapter) => adapter.stop()));
  });

  it('captures an SMS message through MessageService', async () => {
    const messages: Message[] = [];

    const repository: MessageRepository = {
      insert: (message) => {
        messages.push(message);
        return Promise.resolve();
      },
      getById: (id) =>
        Promise.resolve(messages.find((message) => message.id === id) ?? null),
      list: () => Promise.resolve(messages),
    };

    const service = new MessageService(repository, new InProcessEventBus(), {
      idGenerator: () => 'msg_sms_test',
      clock: () => new Date('2026-09-10T10:00:00.000Z'),
    });

    const adapter = new SmsServerAdapter(service, {
      host: '127.0.0.1',
      port: 0,
    });

    adapters.push(adapter);

    await adapter.start();

    const address = adapter.address();

    if (!address) throw new Error('SMS server did not start');

    const response = await fetch(`http://127.0.0.1:${address.port}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: '+15550000001',
        to: '+15550000002',
        body: 'Captured from SMS.',
      }),
    });

    expect(response.status).toBe(201);
    expect(messages).toHaveLength(1);

    expect(messages[0]).toMatchObject({
      id: 'msg_sms_test',
      channel: 'sms',
      protocol: 'http',
      provider: 'local',
      status: 'queued',
      from: '+15550000001',
      to: '+15550000002',
      body: 'Captured from SMS.',
    });
  });

  it('rejects malformed SMS requests', async () => {
    const repository: MessageRepository = {
      insert: () => Promise.resolve(),
      getById: () => Promise.resolve(null),
      list: () => Promise.resolve([]),
    };

    const service = new MessageService(repository, new InProcessEventBus(), {
      idGenerator: () => 'msg_sms_test',
      clock: () => new Date('2026-09-10T10:00:00.000Z'),
    });

    const adapter = new SmsServerAdapter(service, {
      host: '127.0.0.1',
      port: 0,
    });

    adapters.push(adapter);

    await adapter.start();

    const address = adapter.address();

    if (!address) throw new Error('SMS server did not start');

    const response = await fetch(`http://127.0.0.1:${address.port}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: '+15550000001',
        to: '+15550000002',
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'SMS request must include from, to, and body strings',
    });
  });

  it('rejects unsupported routes', async () => {
    const repository: MessageRepository = {
      insert: () => Promise.resolve(),
      getById: () => Promise.resolve(null),
      list: () => Promise.resolve([]),
    };

    const service = new MessageService(repository, new InProcessEventBus(), {
      idGenerator: () => 'msg_sms_test',
      clock: () => new Date('2026-09-10T10:00:00.000Z'),
    });

    const adapter = new SmsServerAdapter(service, {
      host: '127.0.0.1',
      port: 0,
    });

    adapters.push(adapter);

    await adapter.start();

    const address = adapter.address();

    if (!address) throw new Error('SMS server did not start');

    const response = await fetch(`http://127.0.0.1:${address.port}/other`);

    expect(response.status).toBe(404);
  });
});
