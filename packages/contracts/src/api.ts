import type { ListMessagesQuery, Message } from './message.js';

export interface ListMessagesResponse {
  data: Message[];
  nextCursor?: string;
}

export interface GetMessageResponse {
  data: Message;
}

export interface MessagesApi {
  list(query?: ListMessagesQuery): Promise<ListMessagesResponse>;
  get(id: string): Promise<GetMessageResponse>;
}
