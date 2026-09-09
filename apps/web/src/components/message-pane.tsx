import { Inbox } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MessagePane() {
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
        <span className="font-mono text-[0.62rem] text-muted-foreground/45">
          0 visible
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
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
      </ScrollArea>
    </section>
  );
}
