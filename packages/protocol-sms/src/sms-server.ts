import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

import type { MessageService } from '@msgdock/core';

export interface SmsServerOptions {
  host: string;
  port: number;
}

export interface SmsMessageRequest {
  from: string;
  to: string;
  body: string;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body);

  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });

  response.end(payload);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: string[] = [];

  for await (const chunk of request as AsyncIterable<unknown>) {
    if (typeof chunk === 'string') {
      chunks.push(chunk);
      continue;
    }

    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk.toString('utf8'));
      continue;
    }

    throw new Error('Unsupported request body chunk');
  }

  return JSON.parse(chunks.join(''));
}

function parseSmsRequest(value: unknown): SmsMessageRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  const request = value as Record<string, unknown>;

  if (
    typeof request.from !== 'string' ||
    typeof request.to !== 'string' ||
    typeof request.body !== 'string'
  ) {
    throw new Error('SMS request must include from, to, and body strings');
  }

  if (!request.from.trim() || !request.to.trim() || !request.body.trim()) {
    throw new Error('SMS request must include non-empty from, to, and body');
  }

  return {
    from: request.from,
    to: request.to,
    body: request.body,
  };
}

export class SmsServerAdapter {
  private readonly server = createServer((request, response) => {
    void this.handleRequest(request, response);
  });

  constructor(
    private readonly messageService: MessageService,
    private readonly options: SmsServerOptions,
  ) {}

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleError = (error: Error) => {
        this.server.off('listening', handleListening);
        reject(error);
      };

      const handleListening = () => {
        this.server.off('error', handleError);
        resolve();
      };

      this.server.once('error', handleError);
      this.server.once('listening', handleListening);

      this.server.listen(this.options.port, this.options.host);
    });
  }

  stop(): Promise<void> {
    if (!this.server.listening) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  address(): AddressInfo | null {
    const address = this.server.address();

    return address && typeof address !== 'string' ? address : null;
  }

  private async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    if (request.method !== 'POST' || request.url !== '/messages') {
      sendJson(response, 404, {
        error: 'Not found',
      });
      return;
    }

    const contentType = request.headers['content-type'];

    if (
      typeof contentType !== 'string' ||
      contentType.split(';', 1)[0]?.trim() !== 'application/json'
    ) {
      sendJson(response, 415, {
        error: 'Content-Type must be application/json',
      });
      return;
    }

    try {
      const payload = parseSmsRequest(await readJson(request));

      const message = await this.messageService.create({
        channel: 'sms',
        provider: 'sms',
        from: payload.from,
        to: payload.to,
        body: payload.body,
      });

      sendJson(response, 201, {
        message,
      });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
