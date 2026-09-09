import { MsgDockApiClient } from '@msgdock/api-client';
import { MockMessageService } from '@msgdock/mocks';

export function createMockMessagesApi() {
  return new MsgDockApiClient(new MockMessageService());
}
