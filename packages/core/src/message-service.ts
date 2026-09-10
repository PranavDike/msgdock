import type {
  Channel,
  ListMessagesQuery,
  Message,
  MessageStatus,
} from '@msgdock/contracts';

import { MessageNotFoundError, MessageValidationError } from './errors.js';
import type { EventBus } from './events.js';
import type { MessageRepository } from './repository.js';

export interface CreateMessageInput {
  channel: Channel;
  provider: string;
  status?: MessageStatus;
  from: string;
  to: string;
  subject?: string;
  body: string;
}

export interface MessageServiceOptions {
  idGenerator: () => string;
  clock: () => Date;
}

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly eventBus: EventBus,
    private readonly options: MessageServiceOptions,
  ) {}

  async create(input: CreateMessageInput): Promise<Message> {
    const provider = input.provider.trim();
    const from = input.from.trim();
    const to = input.to.trim();
    const body = typeof input.body === 'string' ? input.body.trim() : '';

    if (!provider || !from || !to || !body) {
      throw new MessageValidationError(
        'provider, from, to, and body are required',
      );
    }

    const subject = input.subject?.trim();
    const message: Message = {
      id: this.options.idGenerator(),
      channel: input.channel,
      provider,
      status: input.status ?? 'queued',
      from,
      to,
      body,
      createdAt: this.options.clock().toISOString(),
      ...(subject ? { subject } : {}),
    };

    await this.repository.insert(message);
    await this.eventBus.publish({
      type: 'message.created',
      message,
      occurredAt: message.createdAt,
    });

    return message;
  }

  list(query?: ListMessagesQuery): Promise<Message[]> {
    return this.repository.list(query);
  }

  async get(id: string): Promise<Message> {
    const message = await this.repository.getById(id);

    if (!message) throw new MessageNotFoundError(id);

    return message;
  }
}
