import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import type { Message } from '@msgdock/contracts';

import { SQLiteMessageRepository } from './message-repository.js';

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg_1',
    channel: 'email',
    protocol: 'smtp',
    provider: 'local',
    status: 'queued',
    from: 'hello@example.com',
    to: 'developer@example.com',
    subject: 'Hello',
    body: 'Body',
    createdAt: '2026-09-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('SQLiteMessageRepository', () => {
  const repositories: SQLiteMessageRepository[] = [];

  afterEach(() => {
    for (const repository of repositories.splice(0)) {
      repository.close();
    }
  });

  it('initializes the schema and persists messages', async () => {
    const repository = new SQLiteMessageRepository(':memory:');
    repositories.push(repository);

    const stored = message();

    await repository.insert(stored);

    await expect(repository.getById(stored.id)).resolves.toEqual(stored);
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('lists messages in deterministic newest-first order with filters and limits', async () => {
    const repository = new SQLiteMessageRepository(':memory:');
    repositories.push(repository);

    await repository.insert(
      message({
        id: 'msg_1',
        createdAt: '2026-09-10T10:00:00.000Z',
      }),
    );

    await repository.insert(
      message({
        id: 'msg_2',
        channel: 'sms',
        protocol: 'http',
        provider: 'local',
        status: 'failed',
        createdAt: '2026-09-10T11:00:00.000Z',
      }),
    );

    await repository.insert(
      message({
        id: 'msg_3',
        status: 'delivered',
        createdAt: '2026-09-10T12:00:00.000Z',
      }),
    );

    await expect(repository.list()).resolves.toMatchObject([
      { id: 'msg_3' },
      { id: 'msg_2' },
      { id: 'msg_1' },
    ]);

    await expect(repository.list({ channel: 'email' })).resolves.toMatchObject([
      { id: 'msg_3' },
      { id: 'msg_1' },
    ]);

    await expect(
      repository.list({
        status: 'failed',
        provider: 'local',
        limit: 1,
      }),
    ).resolves.toMatchObject([{ id: 'msg_2' }]);
  });

  it('migrates an existing database without a protocol column', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'msgdock-migration-'));
    const databasePath = join(directory, 'messages.sqlite');

    let repository: SQLiteMessageRepository | undefined;

    try {
      const legacyDatabase = new Database(databasePath);

      legacyDatabase.exec(`
        CREATE TABLE schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );

        INSERT INTO schema_migrations (version, applied_at)
        VALUES (1, '2026-09-10T09:00:00.000Z');

        CREATE TABLE messages (
          id TEXT PRIMARY KEY,
          channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
          provider TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
          from_address TEXT NOT NULL,
          to_address TEXT NOT NULL,
          subject TEXT,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        INSERT INTO messages (
          id,
          channel,
          provider,
          status,
          from_address,
          to_address,
          subject,
          body,
          created_at
        ) VALUES (
          'legacy_email',
          'email',
          'smtp',
          'queued',
          'hello@example.com',
          'developer@example.com',
          'Legacy',
          'Legacy body',
          '2026-09-10T10:00:00.000Z'
        );

        INSERT INTO messages (
          id,
          channel,
          provider,
          status,
          from_address,
          to_address,
          subject,
          body,
          created_at
        ) VALUES (
          'legacy_sms',
          'sms',
          'sms',
          'sent',
          '+10000000000',
          '+20000000000',
          NULL,
          'Legacy SMS',
          '2026-09-10T11:00:00.000Z'
        );
      `);

      legacyDatabase.close();

      repository = new SQLiteMessageRepository(databasePath);

      await expect(repository.getById('legacy_email')).resolves.toMatchObject({
        id: 'legacy_email',
        channel: 'email',
        protocol: 'smtp',
        provider: 'smtp',
      });

      await expect(repository.getById('legacy_sms')).resolves.toMatchObject({
        id: 'legacy_sms',
        channel: 'sms',
        protocol: 'http',
        provider: 'sms',
      });
    } finally {
      repository?.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
