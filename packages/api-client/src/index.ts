import type {
  GetMessageResponse,
  ListMessagesQuery,
  ListMessagesResponse,
  MessagesApi,
} from '@msgdock/contracts';

export interface MessageTransport {
  listMessages(query?: ListMessagesQuery): Promise<ListMessagesResponse>;

  getMessage(id: string): Promise<GetMessageResponse>;
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  if (/^https?:\/\//.test(normalizedBaseUrl)) {
    return new URL(`${normalizedBaseUrl}${path}`).toString();
  }

  return `${normalizedBaseUrl}${path}`;
}

async function readResponse<T>(
  response: Response,
  requestUrl: string,
): Promise<T> {
  const body = await response.text();
  let payload: unknown;

  try {
    payload = body ? (JSON.parse(body) as unknown) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `Request failed with status ${response.status}`;

    throw new Error(`${errorMessage} (${requestUrl})`);
  }

  return payload as T;
}

export class HttpMessageTransport implements MessageTransport {
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(
    private readonly baseUrl: string,
    fetchImpl: typeof globalThis.fetch = globalThis.fetch.bind(globalThis),
  ) {
    this.fetchImpl = fetchImpl;
  }

  async listMessages(
    query: ListMessagesQuery = {},
  ): Promise<ListMessagesResponse> {
    const params = new URLSearchParams();

    if (query.channel) params.set('channel', query.channel);
    if (query.status) params.set('status', query.status);
    if (query.provider) params.set('provider', query.provider);
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.cursor) params.set('cursor', query.cursor);

    const queryString = params.toString();
    const requestUrl = buildUrl(
      this.baseUrl,
      `/messages${queryString ? `?${queryString}` : ''}`,
    );
    const response = await this.fetchImpl(requestUrl);

    return readResponse<ListMessagesResponse>(response, requestUrl);
  }

  async getMessage(id: string): Promise<GetMessageResponse> {
    const requestUrl = buildUrl(
      this.baseUrl,
      `/messages/${encodeURIComponent(id)}`,
    );
    const response = await this.fetchImpl(requestUrl);

    return readResponse<GetMessageResponse>(response, requestUrl);
  }
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
