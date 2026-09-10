import { describe, expect, it, vi } from 'vitest';

import { HttpMessageTransport } from './index.js';

describe('HttpMessageTransport', () => {
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
});
