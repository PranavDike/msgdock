import type {
  GetMessageResponse,
  ListMessagesQuery,
  ListMessagesResponse,
} from '@msgdock/contracts';

import { messages } from './data/messages.js';

export class MockMessageService {
  listMessages(query?: ListMessagesQuery): Promise<ListMessagesResponse> {
    let result = [...messages];

    if (query?.channel) {
      result = result.filter((message) => message.channel === query.channel);
    }

    if (query?.status) {
      result = result.filter((message) => message.status === query.status);
    }

    if (query?.provider) {
      result = result.filter((message) => message.provider === query.provider);
    }

    if (query?.limit) {
      result = result.slice(0, query.limit);
    }

    return Promise.resolve({
      data: result,
    });
  }

  getMessage(id: string): Promise<GetMessageResponse> {
    const message = messages.find((item) => item.id === id);

    if (!message) {
      throw new Error(`Message not found: ${id}`);
    }

    return Promise.resolve({
      data: message,
    });
  }
}
