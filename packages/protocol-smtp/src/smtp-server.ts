import type { AddressInfo } from 'node:net';

import { simpleParser, type AddressObject } from 'mailparser';
import { SMTPServer, type SMTPServerDataStream } from 'smtp-server';

import type { MessageService } from '@msgdock/core';

export interface SmtpServerOptions {
  host: string;
  port: number;
  username: string;
  password: string;
}

function getAddresses(
  value: AddressObject | AddressObject[] | undefined,
): string {
  if (!value) return '';

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((address) => address.value.map((entry) => entry.address))
    .filter((address): address is string => Boolean(address))
    .join(', ');
}

export class SmtpServerAdapter {
  private readonly server: SMTPServer;

  constructor(
    private readonly messageService: MessageService,
    private readonly options: SmtpServerOptions,
  ) {
    this.server = new SMTPServer({
      authOptional: true,
      disabledCommands: ['STARTTLS'],
      allowInsecureAuth: true,
      onAuth: (auth, _session, callback) => {
        if (
          auth.username !== this.options.username ||
          auth.password !== this.options.password
        ) {
          callback(new Error('Invalid SMTP credentials'));
          return;
        }

        callback(null, { user: auth.username });
      },
      onData: (stream, _session, callback) => {
        void this.handleMessage(stream)
          .then(() => callback())
          .catch((error: unknown) =>
            callback(error instanceof Error ? error : new Error(String(error))),
          );
      },
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleError = (error: Error) => {
        this.server.server.off('listening', handleListening);
        reject(error);
      };
      const handleListening = () => {
        this.server.server.off('error', handleError);
        resolve();
      };

      this.server.server.once('error', handleError);
      this.server.server.once('listening', handleListening);
      this.server.listen(this.options.port, this.options.host);
    });
  }

  stop(): Promise<void> {
    if (!this.server.server.listening) return Promise.resolve();

    return new Promise<void>((resolve) => {
      this.server.close(() => resolve());
    });
  }

  address(): AddressInfo | null {
    const address = this.server.server.address();
    return address && typeof address !== 'string' ? address : null;
  }

  private async handleMessage(stream: SMTPServerDataStream): Promise<void> {
    const parsed = await simpleParser(stream);
    const from = getAddresses(parsed.from);
    const to = getAddresses(parsed.to);
    const body =
      parsed.text ?? (typeof parsed.html === 'string' ? parsed.html : '');

    if (!from || !to) {
      throw new Error('SMTP message must include from and to addresses');
    }

    await this.messageService.create({
      channel: 'email',
      provider: 'smtp',
      from,
      to,
      ...(parsed.subject ? { subject: parsed.subject } : {}),
      body,
    });
  }
}
