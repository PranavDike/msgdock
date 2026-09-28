import type { ChannelProvider } from './channel-provider.js';

export interface EmailProvider extends ChannelProvider {
  readonly channel: 'email';
}
