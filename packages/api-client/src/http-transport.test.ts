import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpMessageTransport } from './index.js';

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  readonly listeners = new Map<string, EventListener>();

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.listeners.get(type) === listener) {
      this.listeners.delete(type);
    }
  }

  close = vi.fn();

  emit(type: string, data: unknown): void {
    const event = new globalThis.MessageEvent(type, {
      data: JSON.stringify(data),
    });

    const listener = this.listeners.get(type);

    if (listener) {
      listener(event);
    }
  }
}

describe('HttpMessageTransport', () => {
  afterEach(() => {
    FakeEventSource.instances = [];
    vi.unstubAllGlobals();
  });

  it('builds list requests from the typed query', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      );
    const transport = new HttpMessageTransport('/api', fetchImpl);

    await expect(
      transport.listMessages({
        channel: 'email',
        status: 'failed',
        provider: 'smtp',
        limit: 25,
        cursor: 'next',
      }),
    ).resolves.toEqual({ data: [] });

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/messages?channel=email&status=failed&provider=smtp&limit=25&cursor=next',
    );
  });

  it('encodes IDs and surfaces API errors', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Message not found: msg/1' } }),
          { status: 404 },
        ),
      );
    const transport = new HttpMessageTransport(
      'http://localhost:6969/api',
      fetchImpl,
    );

    await expect(transport.getMessage('msg/1')).rejects.toThrow(
      'Message not found: msg/1',
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:6969/api/messages/msg%2F1',
    );
  });

  it('subscribes to message-created events and closes the stream', () => {
    vi.stubGlobal('EventSource', FakeEventSource);

    const transport = new HttpMessageTransport('/api');
    const handler = vi.fn();

    const unsubscribe = transport.subscribe('message.created', handler);

    const source = FakeEventSource.instances.at(-1);

    expect(source?.url).toBe('/api/messages/stream');

    const event = {
      type: 'message.created' as const,
      message: {
        id: 'msg_1',
        channel: 'email' as const,
        provider: 'smtp',
        status: 'queued' as const,
        from: 'hello@example.com',
        to: 'developer@example.com',
        subject: 'Hello',
        body: 'Body',
        createdAt: '2026-09-10T10:00:00.000Z',
      },
      occurredAt: '2026-09-10T10:00:00.000Z',
    };

    source?.emit('message.created', event);

    expect(handler).toHaveBeenCalledWith(event);

    unsubscribe();

    expect(source?.close).toHaveBeenCalledOnce();
  });
});
