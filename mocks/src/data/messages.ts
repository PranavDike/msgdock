import type { Message } from '@msgdock/contracts';

export const messages: Message[] = [
  {
    id: 'msg_001',
    channel: 'sms',
    provider: 'mock-sms',
    status: 'delivered',
    from: '+15550000001',
    to: '+15550000002',
    body: 'Your verification code is 482913.',
    createdAt: '2026-09-02T09:00:00.000Z',
  },
  {
    id: 'msg_002',
    channel: 'email',
    provider: 'mock-email',
    status: 'sent',
    from: 'hello@msgdock.local',
    to: 'developer@example.com',
    subject: 'Welcome to MsgDock',
    body: 'This is a development email.',
    createdAt: '2026-09-02T09:05:00.000Z',
  },
];
