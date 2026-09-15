import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

import type { MsgDockConfig } from '@msgdock/config';
import { InProcessEventBus, MessageService } from '@msgdock/core';
import { SmtpServerAdapter } from '@msgdock/protocol-smtp';
import { SQLiteMessageRepository } from '@msgdock/storage-sqlite';

import { createApiHandler } from './api-handler.js';
import {
  createApplicationHandler,
  type ApiMount,
} from './application-handler.js';
import { HttpServer } from './http-server.js';

export interface CoreRuntimeOptions {
  apiHost?: string;
  staticRoot?: string;
}

export interface CoreRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
  httpAddress(): AddressInfo | null;
  smtpAddress(): AddressInfo | null;
}

export function createRuntime(
  config: MsgDockConfig,
  options: CoreRuntimeOptions = {},
): CoreRuntime {
  const repository = new SQLiteMessageRepository(config.database.path);
  const eventBus = new InProcessEventBus();
  const messageService = new MessageService(repository, eventBus, {
    idGenerator: () => randomUUID(),
    clock: () => new Date(),
  });
  const localApiHandler = createApiHandler(
    messageService,
    config.http.basePath,
  );
  const apiMounts: ApiMount[] = [
    { path: config.http.basePath, handler: localApiHandler },
  ];

  if (options.apiHost) {
    apiMounts.push({
      host: options.apiHost,
      path: '/',
      handler: createApiHandler(messageService, ''),
    });
  }

  const httpServer = new HttpServer(
    createApplicationHandler({
      apiMounts,
      staticRoot:
        options.staticRoot ??
        resolve(dirname(fileURLToPath(import.meta.url)), '../../web/dist'),
    }),
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
