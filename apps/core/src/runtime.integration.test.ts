import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import nodemailer from 'nodemailer';
import { afterEach, describe, expect, it } from 'vitest';

import type { MsgDockConfig } from '@msgdock/config';

import { createRuntime, type CoreRuntime } from './runtime.js';

function testConfig(databasePath = ':memory:'): MsgDockConfig {
  return {
    environment: 'test',
    http: {
      host: '127.0.0.1',
      port: 0,
      basePath: '/api',
    },
    smtp: {
      enabled: true,
      host: '127.0.0.1',
      port: 0,
      username: 'msgdock',
      password: 'msgdock',
    },
    sms: {
      enabled: false,
      host: '127.0.0.1',
      port: 0,
    },
    database: {
      path: databasePath,
    },
  };
}

async function sendTestEmail(runtime: CoreRuntime): Promise<void> {
  const smtpAddress = runtime.smtpAddress();

  if (!smtpAddress) {
    throw new Error('SMTP server did not start');
  }

  const transport = nodemailer.createTransport({
    host: '127.0.0.1',
    port: smtpAddress.port,
    auth: {
      user: 'msgdock',
      pass: 'msgdock',
    },
  });

  await transport.sendMail({
    from: 'hello@example.com',
    to: 'developer@example.com',
    subject: 'Runtime integration test',
    text: 'Captured end to end.',
  });
}

async function getMessages(
  runtime: CoreRuntime,
): Promise<Array<Record<string, unknown>>> {
  const httpAddress = runtime.httpAddress();

  if (!httpAddress) {
    throw new Error('HTTP server did not start');
  }

  const response = await fetch(
    `http://127.0.0.1:${httpAddress.port}/api/messages`,
  );

  expect(response.status).toBe(200);

  const payload = (await response.json()) as {
    data: Array<Record<string, unknown>>;
  };

  return payload.data;
}

async function readSseEvent(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error('SSE response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!buffer.includes('\n\n')) {
    const result = await reader.read();

    if (result.done) {
      throw new Error('SSE stream closed before receiving an event');
    }

    buffer += decoder.decode(result.value, { stream: true });
  }

  await reader.cancel();

  return buffer;
}

describe('core runtime integration', () => {
  const runtimes: CoreRuntime[] = [];

  afterEach(async () => {
    await Promise.all(runtimes.splice(0).map((runtime) => runtime.stop()));
  });

  it('captures SMTP into SQLite and returns it through HTTP', async () => {
    const runtime = createRuntime(testConfig());
    runtimes.push(runtime);

    await runtime.start();

    await sendTestEmail(runtime);

    const messages = await getMessages(runtime);

    expect(messages).toHaveLength(1);

    expect(messages[0]).toMatchObject({
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Runtime integration test',
      body: 'Captured end to end.',
    });
  }, 15_000);

  it('returns captured message details through the HTTP API', async () => {
    const runtime = createRuntime(testConfig());
    runtimes.push(runtime);

    await runtime.start();

    await sendTestEmail(runtime);

    const messages = await getMessages(runtime);

    expect(messages).toHaveLength(1);

    const messageId = messages[0]?.id;

    expect(typeof messageId).toBe('string');

    const httpAddress = runtime.httpAddress();

    if (!httpAddress) {
      throw new Error('HTTP server did not start');
    }

    const response = await fetch(
      `http://127.0.0.1:${httpAddress.port}/api/messages/${encodeURIComponent(
        String(messageId),
      )}`,
    );

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: Record<string, unknown>;
    };

    expect(payload.data).toMatchObject({
      id: messageId,
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Runtime integration test',
      body: 'Captured end to end.',
    });
  }, 15_000);

  it('persists captured messages across runtime restarts', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'msgdock-integration-'));
    const databasePath = join(tempDirectory, 'msgdock.sqlite');

    let firstRuntime: CoreRuntime | undefined;
    let secondRuntime: CoreRuntime | undefined;

    try {
      firstRuntime = createRuntime(testConfig(databasePath));

      await firstRuntime.start();

      await sendTestEmail(firstRuntime);

      const messagesBeforeRestart = await getMessages(firstRuntime);

      expect(messagesBeforeRestart).toHaveLength(1);

      const messageId = messagesBeforeRestart[0]?.id;

      expect(typeof messageId).toBe('string');

      await firstRuntime.stop();
      firstRuntime = undefined;

      secondRuntime = createRuntime(testConfig(databasePath));

      await secondRuntime.start();

      const messagesAfterRestart = await getMessages(secondRuntime);

      expect(messagesAfterRestart).toHaveLength(1);

      expect(messagesAfterRestart[0]).toMatchObject({
        id: messageId,
        channel: 'email',
        provider: 'smtp',
        status: 'queued',
        from: 'hello@example.com',
        to: 'developer@example.com',
        subject: 'Runtime integration test',
        body: 'Captured end to end.',
      });
    } finally {
      if (firstRuntime) {
        await firstRuntime.stop();
      }

      if (secondRuntime) {
        await secondRuntime.stop();
      }

      await rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  }, 15_000);

  it('streams captured SMTP messages through server-sent events', async () => {
    const runtime = createRuntime(testConfig());
    runtimes.push(runtime);

    await runtime.start();

    const httpAddress = runtime.httpAddress();

    if (!httpAddress) {
      throw new Error('HTTP server did not start');
    }

    const response = await fetch(
      `http://127.0.0.1:${httpAddress.port}/api/messages/stream`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/event-stream; charset=utf-8',
    );

    const eventPromise = readSseEvent(response);

    await sendTestEmail(runtime);

    const event = await eventPromise;

    expect(event).toContain('event: message.created');

    const dataLine = event
      .split('\n')
      .find((line) => line.startsWith('data: '));

    expect(dataLine).toBeDefined();

    const payload = JSON.parse(dataLine!.slice('data: '.length)) as {
      type: string;
      message: Record<string, unknown>;
      occurredAt: string;
    };

    expect(payload.type).toBe('message.created');
    expect(payload.message).toMatchObject({
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Runtime integration test',
      body: 'Captured end to end.',
    });
    expect(typeof payload.message.id).toBe('string');
    expect(typeof payload.occurredAt).toBe('string');
  }, 15_000);
});
