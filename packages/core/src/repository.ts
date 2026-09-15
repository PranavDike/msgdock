import type { ListMessagesQuery, Message } from '@msgdock/contracts';

export interface MessageRepository {
  insert(message: Message): Promise<void>;
  getById(id: string): Promise<Message | null>;
  list(query?: ListMessagesQuery): Promise<Message[]>;
}
