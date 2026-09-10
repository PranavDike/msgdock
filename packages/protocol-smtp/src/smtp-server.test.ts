import { afterEach, describe, expect, it } from 'vitest';
import nodemailer from 'nodemailer';

import type { Message } from '@msgdock/contracts';
import {
  InProcessEventBus,
  MessageService,
  type MessageRepository,
} from '@msgdock/core';

import { SmtpServerAdapter } from './smtp-server.js';

describe('SmtpServerAdapter', () => {
  const adapters: SmtpServerAdapter[] = [];

  afterEach(async () => {
    await Promise.all(adapters.splice(0).map((adapter) => adapter.stop()));
  });

  it('captures a real SMTP message through MessageService', async () => {
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
      idGenerator: () => 'msg_smtp_test',
      clock: () => new Date('2026-09-10T10:00:00.000Z'),
    });
    const adapter = new SmtpServerAdapter(service, {
      host: '127.0.0.1',
      port: 0,
      username: 'msgdock',
      password: 'msgdock',
    });
    adapters.push(adapter);
    await adapter.start();

    const address = adapter.address();
    if (!address) throw new Error('SMTP server did not start');

    const transport = nodemailer.createTransport({
      host: '127.0.0.1',
      port: address.port,
      auth: { user: 'msgdock', pass: 'msgdock' },
    });
    await transport.sendMail({
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'SMTP capture',
      text: 'Captured from Nodemailer.',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: 'msg_smtp_test',
      channel: 'email',
      provider: 'smtp',
      status: 'queued',
      from: 'hello@example.com',
      to: 'developer@example.com',
      subject: 'SMTP capture',
      body: 'Captured from Nodemailer.',
    });
  });
});
