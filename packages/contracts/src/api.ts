import type { ListMessagesQuery, Message } from './message.js';

export interface ListMessagesResponse {
  data: Message[];
  nextCursor?: string;
}

export interface GetMessageResponse {
  data: Message;
}

export interface MessageCreatedEvent {
  type: 'message.created';
  message: Message;
  occurredAt: string;
}

export type MessageEvent = MessageCreatedEvent;

export type MessageEventType = MessageEvent['type'];

export type MessageEventHandler<T extends MessageEventType> = (
  event: Extract<MessageEvent, { type: T }>,
) => void;

export interface MessagesApi {
  list(query?: ListMessagesQuery): Promise<ListMessagesResponse>;
  get(id: string): Promise<GetMessageResponse>;
  subscribe(
    type: 'message.created',
    handler: MessageEventHandler<'message.created'>,
  ): () => void;
}
