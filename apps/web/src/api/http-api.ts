import { HttpMessageTransport, MsgDockApiClient } from '@msgdock/api-client';

export function createHttpMessagesApi() {
  const configuredApiUrl = (
    import.meta.env as { VITE_MSGDOCK_API_URL?: unknown }
  ).VITE_MSGDOCK_API_URL;
  const baseUrl =
    typeof configuredApiUrl === 'string' ? configuredApiUrl : '/api';

  return new MsgDockApiClient(new HttpMessageTransport(baseUrl));
}
