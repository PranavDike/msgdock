import { describe, expect, it } from 'vitest';

import type { Channel, MessageStatus } from '@msgdock/contracts';

import { MockMessageService } from './server.js';

const statuses: MessageStatus[] = ['queued', 'sent', 'delivered', 'failed'];

describe('MockMessageService', () => {
  it.each(['email', 'sms'] as Channel[])(
    'provides every status for %s',
    async (channel) => {
      const service = new MockMessageService();
      const response = await service.listMessages({ channel });

      expect(response.data).toHaveLength(4);
      expect(response.data.map((message) => message.status)).toEqual(statuses);
    },
  );
});
