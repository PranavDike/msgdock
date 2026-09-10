import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';

import type { MsgDockConfig } from '@msgdock/config';
import { InProcessEventBus, MessageService } from '@msgdock/core';
import { SmtpServerAdapter } from '@msgdock/protocol-smtp';
import { SQLiteMessageRepository } from '@msgdock/storage-sqlite';

import { createApiHandler } from './api-handler.js';
import { HttpServer } from './http-server.js';

export interface CoreRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
  httpAddress(): AddressInfo | null;
  smtpAddress(): AddressInfo | null;
}

export function createRuntime(config: MsgDockConfig): CoreRuntime {
  const repository = new SQLiteMessageRepository(config.database.path);
  const eventBus = new InProcessEventBus();
  const messageService = new MessageService(repository, eventBus, {
    idGenerator: () => randomUUID(),
    clock: () => new Date(),
  });
  const httpServer = new HttpServer(
    createApiHandler(messageService, config.http.basePath),
    config.http,
  );
  const smtpServer = config.smtp.enabled
    ? new SmtpServerAdapter(messageService, config.smtp)
    : null;
  let closed = false;

  return {
    async start() {
      if (closed) throw new Error('MsgDock runtime has been stopped');

      try {
        await httpServer.start();
        if (smtpServer) await smtpServer.start();
      } catch (error) {
        await this.stop();
        throw error;
      }
    },
    async stop() {
      if (closed) return;

      try {
        if (smtpServer) await smtpServer.stop();
        await httpServer.stop();
      } finally {
        repository.close();
        closed = true;
      }
    },
    httpAddress() {
      const address = httpServer.address();
      return address && typeof address !== 'string' ? address : null;
    },
    smtpAddress() {
      return smtpServer?.address() ?? null;
    },
  };
}
