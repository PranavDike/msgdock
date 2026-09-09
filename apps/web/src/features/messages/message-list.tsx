import type { Message } from '@msgdock/contracts';

import { Mail, MessageSquareText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { channelLabel, statusClassName, statusLabel } from './message-options';

interface MessageListProps {
  messages: Message[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatMessageTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(createdAt));
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
}: MessageListProps) {
  return (
    <div className="divide-y divide-border">
      {messages.map((message) => {
        const ChannelIcon =
          message.channel === 'email' ? Mail : MessageSquareText;
        const preview = message.subject ?? message.body;
        const rowLabel = `${channelLabel(message.channel)}, ${message.status}, ${preview}`;

        return (
          <button
            key={message.id}
            type="button"
            aria-label={rowLabel}
            aria-pressed={selectedId === message.id}
            className={cn(
              'group flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring md:px-7',
              selectedId === message.id && 'bg-muted/45',
            )}
            onClick={() => onSelect(message.id)}
          >
            <div className="flex items-center gap-2">
              <ChannelIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
              />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground/70">
                {channelLabel(message.channel)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-auto rounded-sm px-1.5 py-0 font-mono text-[0.58rem] uppercase tracking-[0.08em]',
                  statusClassName(message.status),
                )}
              >
                {statusLabel(message.status)}
              </Badge>
            </div>
            <div className="flex min-w-0 items-baseline justify-between gap-4">
              <p className="truncate text-sm font-medium text-foreground">
                <span>{message.from}</span>
                <span className="px-1.5 text-muted-foreground/40">→</span>
                <span>{message.to}</span>
              </p>
              <time
                dateTime={message.createdAt}
                className="shrink-0 font-mono text-[0.62rem] text-muted-foreground/50"
              >
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-4">
              <p className="truncate text-xs text-muted-foreground">
                {preview}
              </p>
              <span className="shrink-0 font-mono text-[0.6rem] text-muted-foreground/45">
                {message.provider}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
