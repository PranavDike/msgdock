import type { Channel, MessageStatus } from '@msgdock/contracts';

export const channelOptions: Array<{ label: string; value: Channel | 'all' }> =
  [
    { label: 'All channels', value: 'all' },
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
  ];

export const statusOptions: Array<{
  label: string;
  value: MessageStatus | 'all';
}> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Queued', value: 'queued' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Failed', value: 'failed' },
];

export function channelLabel(channel: Channel) {
  return channel === 'email' ? 'Email' : 'SMS';
}

export function statusLabel(status: MessageStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusClassName(status: MessageStatus) {
  switch (status) {
    case 'delivered':
      return 'border-status-success/30 bg-status-success/10 text-status-success';
    case 'failed':
      return 'border-status-failed/30 bg-status-failed/10 text-status-failed';
    case 'sent':
      return 'border-status-info/30 bg-status-info/10 text-status-info';
    case 'queued':
      return 'border-status-warning/30 bg-status-warning/10 text-status-warning';
  }
}
