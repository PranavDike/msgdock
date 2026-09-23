import type {
  Channel,
  Message,
  MessageStatus,
  ListMessagesQuery,
} from '@msgdock/contracts';

import { Inbox, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageFilters } from '@/features/messages/message-filters';
import { MessageList } from '@/features/messages/message-list';

interface MessagePaneProps {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  selectedId: string | null;
  channel: Channel | 'all';
  status: MessageStatus | 'all';
  provider: string;
  onFilterChange: (query: ListMessagesQuery) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

function MessageLoading() {
  return (
    <div aria-label="Loading messages" className="divide-y divide-border">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 px-5 py-4 md:px-7">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-3/5" />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagePane({
  messages,
  isLoading,
  error,
  selectedId,
  channel,
  status,
  provider,
  onFilterChange,
  onResetFilters,
  onSelect,
  onRefresh,
}: MessagePaneProps) {
  return (
    <section
      aria-labelledby="message-pane-title"
      className="flex min-h-0 min-w-0 flex-col border-b border-border lg:border-b-0 lg:border-r"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-5">
        <h2
          id="message-pane-title"
          className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground/75"
        >
          message stream
        </h2>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 font-mono text-[0.62rem] text-muted-foreground"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh messages"
          >
            <RefreshCw aria-hidden="true" className="size-3" />
            refresh
          </Button>

          <span className="font-mono text-[0.62rem] text-muted-foreground/45">
            {isLoading ? 'querying' : `${messages.length} visible`}
          </span>
        </div>
      </div>

      <MessageFilters
        channel={channel}
        status={status}
        provider={provider}
        onChange={onFilterChange}
        onReset={onResetFilters}
      />

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? <MessageLoading /> : null}
        {!isLoading && error ? (
          <div className="p-5 md:p-7">
            <Alert variant="destructive">
              <AlertTitle>Unable to load messages</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {!isLoading && !error && messages.length === 0 ? (
          <Empty className="min-h-[22rem] rounded-none border-0 p-8">
            <EmptyMedia
              variant="icon"
              className="size-10 rounded-sm border border-border bg-muted/30 text-muted-foreground"
            >
              <Inbox aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="font-mono text-sm font-medium tracking-tight">
                No messages in this view
              </EmptyTitle>
              <EmptyDescription className="max-w-xs text-xs leading-5 text-muted-foreground/70">
                Captured email and SMS traffic will appear here through the API
                client.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {!isLoading && !error && messages.length > 0 ? (
          <MessageList
            messages={messages}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : null}
      </ScrollArea>
    </section>
  );
}
