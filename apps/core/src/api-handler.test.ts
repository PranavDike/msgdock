import { createServer } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Message } from '@msgdock/contracts';
import { MessageNotFoundError } from '@msgdock/core';
import type { MessageService } from '@msgdock/core';

import { createApiHandler } from './api-handler.js';

const sampleMessage: Message = {
  id: 'msg_1',
  channel: 'email',
  provider: 'smtp',
  status: 'queued',
  from: 'hello@example.com',
  to: 'developer@example.com',
  subject: 'Hello',
  body: 'Body',
  createdAt: '2026-09-10T10:00:00.000Z',
};

describe('HTTP API handler', () => {
  const servers: ReturnType<typeof createServer>[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve) => {
            if (!server.listening) return resolve();
            server.close(() => resolve());
          }),
      ),
    );
  });

  async function start(service: Pick<MessageService, 'list' | 'get'>) {
    const server = createServer(createApiHandler(service));
    servers.push(server);
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();

    if (!address || typeof address === 'string')
      throw new Error('No server address');

    return `http://127.0.0.1:${address.port}`;
  }

  it('serves health and list responses', async () => {
    const service = {
      list: vi.fn().mockResolvedValue([sampleMessage]),
      get: vi.fn(),
    } as unknown as Pick<MessageService, 'list' | 'get'>;
    const baseUrl = await start(service);

    const health = await fetch(`${baseUrl}/api/health`);
    const list = await fetch(`${baseUrl}/api/messages?channel=email&limit=10`);

    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({
      status: 'ok',
      service: 'msgdock-core',
    });
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toEqual({ data: [sampleMessage] });
    expect(service.list).toHaveBeenCalledWith({ channel: 'email', limit: 10 });
  });

  it('serves a message and returns useful client errors', async () => {
    const service = {
      list: vi.fn(),
      get: vi.fn().mockResolvedValue(sampleMessage),
    } as unknown as Pick<MessageService, 'list' | 'get'>;
    const baseUrl = await start(service);

    const message = await fetch(`${baseUrl}/api/messages/msg_1`);
    const invalid = await fetch(`${baseUrl}/api/messages?limit=zero`);

    expect(message.status).toBe(200);
    await expect(message.json()).resolves.toEqual({ data: sampleMessage });
    expect(service.get).toHaveBeenCalledWith('msg_1');
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: { code: 'invalid_query' },
    });
  });
  it('returns a structured 404 for missing messages', async () => {
    const service = {
      list: vi.fn(),
      get: vi.fn().mockRejectedValue(new MessageNotFoundError('missing')),
    } as unknown as Pick<MessageService, 'list' | 'get'>;
    const baseUrl = await start(service);

    const response = await fetch(`${baseUrl}/api/messages/missing`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'not_found', message: 'Message not found: missing' },
    });
  });
});
