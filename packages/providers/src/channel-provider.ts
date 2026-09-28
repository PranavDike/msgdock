import type { Channel } from '@msgdock/contracts';

import type { Provider } from './provider.js';

export interface ChannelProvider extends Provider {
  readonly channel: Channel;
}
