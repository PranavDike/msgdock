import type { ChannelProvider } from './channel-provider.js';

export interface SmsProvider extends ChannelProvider {
  readonly channel: 'sms';
}
