import type { Message } from '@msgdock/contracts';

import { AlertCircle, Inbox, Mail, MessageSquareText } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  channelLabel,
  statusClassName,
  statusLabel,
} from '@/features/messages/message-options';

interface DetailsPaneProps {
  message: Message | null;
  isLoading: boolean;
  error: Error | null;
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="font-mono text-[0.63rem] uppercase tracking-[0.08em] text-muted-foreground/55">
        {label}
      </dt>
      <dd className="max-w-[11rem] break-words text-right font-mono text-[0.68rem] text-foreground/85">
        {value}
      </dd>
    </div>
  );
}

function DetailsLoading() {
  return (
    <div
      aria-label="Loading message details"
      className="flex flex-col gap-5 p-5"
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-40" />
      <div className="divide-y divide-border border-y border-border">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center justify-between py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function DetailsPane({ message, isLoading, error }: DetailsPaneProps) {
  const ChannelIcon = message?.channel === 'email' ? Mail : MessageSquareText;

  return (
    <aside
      aria-labelledby="details-pane-title"
      className="flex min-h-0 flex-col bg-card/20"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-border px-5">
        <h2
          id="details-pane-title"
          className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground/75"
        >
          inspector
        </h2>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? <DetailsLoading /> : null}
        {!isLoading && error ? (
          <div className="p-5">
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Unable to load message</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {!isLoading && !error && !message ? (
          <Empty className="min-h-[22rem] rounded-none border-0 p-5">
            <EmptyMedia
              variant="icon"
              className="size-9 rounded-sm border border-border bg-muted/30 text-muted-foreground"
            >
              <Inbox aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="font-mono text-sm font-medium tracking-tight">
                Nothing selected
              </EmptyTitle>
              <EmptyDescription className="text-xs leading-5 text-muted-foreground/70">
                Select a message from the stream to inspect its delivery
                metadata.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {!isLoading && !error && message ? (
          <div className="flex flex-col gap-5 p-5">
            <div>
              <div className="flex items-center gap-2">
                <ChannelIcon
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground/55">
                  {channelLabel(message.channel)} / {message.provider}
                </p>
              </div>
              <h3 className="mt-2 text-base font-medium tracking-tight text-foreground">
                {message.subject ?? message.body}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  'mt-3 rounded-sm px-1.5 py-0 font-mono text-[0.58rem] uppercase tracking-[0.08em]',
                  statusClassName(message.status),
                )}
              >
                {statusLabel(message.status)}
              </Badge>
            </div>

            <dl className="divide-y divide-border border-y border-border">
              <DetailField label="From" value={message.from} />
              <DetailField label="To" value={message.to} />
              <DetailField
                label="Created"
                value={formatCreatedAt(message.createdAt)}
              />
              {message.subject ? (
                <DetailField label="Subject" value={message.subject} />
              ) : null}
            </dl>

            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground/55">
                body
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-sm border border-border bg-muted/20 p-3 text-sm leading-6 text-foreground/85">
                {message.body}
              </p>
            </div>
          </div>
        ) : null}
      </ScrollArea>
    </aside>
  );
}
