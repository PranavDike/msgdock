import nodemailer from 'nodemailer';
import { afterEach, describe, expect, it } from 'vitest';

import type { MsgDockConfig } from '@msgdock/config';

import { createRuntime, type CoreRuntime } from './runtime.js';

function testConfig(): MsgDockConfig {
  return {
    environment: 'test',
    http: { host: '127.0.0.1', port: 0, basePath: '/api' },
    smtp: {
      enabled: true,
      host: '127.0.0.1',
      port: 0,
      username: 'msgdock',
      password: 'msgdock',
    },
    sms: { enabled: false, host: '127.0.0.1', port: 0 },
    database: { path: ':memory:' },
  };
}

describe('core runtime', () => {
  const runtimes: CoreRuntime[] = [];

  afterEach(async () => {
    await Promise.all(runtimes.splice(0).map((runtime) => runtime.stop()));
  });

  it('captures SMTP into SQLite and returns it through HTTP', async () => {
    const runtime = createRuntime(testConfig());
    runtimes.push(runtime);
    await runtime.start();

    const httpAddress = runtime.httpAddress();
    const smtpAddress = runtime.smtpAddress();
    if (!httpAddress || !smtpAddress) throw new Error('Runtime did not start');

    const transport = nodemailer.createTransport({
      host: '127.0.0.1',
      port: smtpAddress.port,
      auth: { user: 'msgdock', pass: 'msgdock' },
    });
    await transport.sendMail({
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Runtime acceptance test',
      text: 'Captured end to end.',
    });

    const response = await fetch(
      `http://127.0.0.1:${httpAddress.port}/api/messages`,
    );
    const payload = (await response.json()) as {
      data: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'Runtime acceptance test',
      body: 'Captured end to end.',
    });
  }, 15_000);
});
