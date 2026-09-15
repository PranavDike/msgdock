import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-background px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger
          aria-label="Toggle navigation"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        />
        <span className="font-mono text-[0.7rem] font-semibold tracking-[0.22em] text-foreground">
          MSGDOCK
        </span>
        <span className="hidden font-mono text-[0.65rem] text-muted-foreground/60 sm:inline">
          / local communication sandbox
        </span>
      </div>

      <Badge
        variant="outline"
        className="h-6 rounded-sm border-status-success/35 bg-status-success/5 px-2 font-mono text-[0.65rem] font-medium tracking-[0.08em] text-status-success"
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-status-success"
        />
        development
      </Badge>
    </header>
  );
}
