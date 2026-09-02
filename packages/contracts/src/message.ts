export type Channel = 'email' | 'sms';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id: string;
  channel: Channel;
  provider: string;
  status: MessageStatus;
  from: string;
  to: string;
  subject?: string;
  body: string;
  createdAt: string;
}

export interface ListMessagesQuery {
  channel?: Channel;
  status?: MessageStatus;
  provider?: string;
  limit?: number;
  cursor?: string;
}
