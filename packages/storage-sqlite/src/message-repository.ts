import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { ListMessagesQuery, Message } from '@msgdock/contracts';
import Database from 'better-sqlite3';

import { UnsupportedQueryError } from '@msgdock/core';
import type { MessageRepository } from '@msgdock/core';

interface MessageRow {
  id: string;
  channel: Message['channel'];
  provider: string;
  status: Message['status'];
  from_address: string;
  to_address: string;
  subject: string | null;
  body: string;
  created_at: string;
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    channel: row.channel,
    provider: row.provider,
    status: row.status,
    from: row.from_address,
    to: row.to_address,
    body: row.body,
    createdAt: row.created_at,
    ...(row.subject === null ? {} : { subject: row.subject }),
  };
}

export class SQLiteMessageRepository implements MessageRepository {
  private readonly database: Database.Database;

  constructor(databasePath: string) {
    if (databasePath !== ':memory:') {
      mkdirSync(dirname(resolve(databasePath)), { recursive: true });
    }

    this.database = new Database(databasePath);

    if (databasePath !== ':memory:') this.database.pragma('journal_mode = WAL');

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
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

      CREATE INDEX IF NOT EXISTS messages_channel_created_at_idx
        ON messages (channel, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS messages_status_created_at_idx
        ON messages (status, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS messages_provider_created_at_idx
        ON messages (provider, created_at DESC, id DESC);
    `);
    this.database
      .prepare(
        'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, ?)',
      )
      .run(new Date().toISOString());
  }

  insert(message: Message): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO messages (
          id, channel, provider, status, from_address, to_address, subject, body, created_at
        ) VALUES (@id, @channel, @provider, @status, @from, @to, @subject, @body, @createdAt)`,
      )
      .run({
        id: message.id,
        channel: message.channel,
        provider: message.provider,
        status: message.status,
        from: message.from,
        to: message.to,
        subject: message.subject ?? null,
        body: message.body,
        createdAt: message.createdAt,
      });
    return Promise.resolve();
  }

  getById(id: string): Promise<Message | null> {
    const row = this.database
      .prepare('SELECT * FROM messages WHERE id = ?')
      .get(id) as MessageRow | undefined;

    return Promise.resolve(row ? toMessage(row) : null);
  }

  list(query: ListMessagesQuery = {}): Promise<Message[]> {
    if (query.cursor) {
      throw new UnsupportedQueryError(
        'Cursor pagination is not implemented by the local repository yet',
      );
    }

    const conditions: string[] = [];
    const parameters: Record<string, string | number> = {};

    if (query.channel) {
      conditions.push('channel = @channel');
      parameters.channel = query.channel;
    }

    if (query.status) {
      conditions.push('status = @status');
      parameters.status = query.status;
    }

    if (query.provider) {
      conditions.push('provider = @provider');
      parameters.provider = query.provider;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit ?? 100;
    parameters.limit = limit;

    const rows = this.database
      .prepare(
        `SELECT * FROM messages ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT @limit`,
      )
      .all(parameters) as MessageRow[];

    return Promise.resolve(rows.map(toMessage));
  }

  close(): void {
    this.database.close();
  }
}
