import type {
  ListMessagesQuery,
  ListMessagesResponse,
  MessagesApi,
  GetMessageResponse,
} from '@msgdock/contracts';

export interface MessageTransport {
  listMessages(query?: ListMessagesQuery): Promise<ListMessagesResponse>;

  getMessage(id: string): Promise<GetMessageResponse>;
}

export class MsgDockApiClient implements MessagesApi {
  constructor(private readonly transport: MessageTransport) {}

  list(query?: ListMessagesQuery): Promise<ListMessagesResponse> {
    return this.transport.listMessages(query);
  }

  get(id: string): Promise<GetMessageResponse> {
    return this.transport.getMessage(id);
  }
}
