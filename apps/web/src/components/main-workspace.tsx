import { DetailsPane } from '@/components/details-pane';
import { MessagePane } from '@/components/message-pane';
import type { WorkspaceSection } from '@/components/navigation';

interface MainWorkspaceProps {
  activeSection: WorkspaceSection;
}

export function MainWorkspace({ activeSection }: MainWorkspaceProps) {
  const contextLabel =
    activeSection === 'Overview' ? 'all channels' : activeSection;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-border px-5 py-4 md:px-7 md:py-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground/55">
            capture stream / {contextLabel.toLowerCase()}
          </p>
          <h1 className="mt-2 font-heading text-xl font-medium tracking-tight text-foreground md:text-2xl">
            Messages
          </h1>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground/45 sm:flex">
          <span className="size-1.5 rounded-full bg-status-success" />
          awaiting transport
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <MessagePane />
        <DetailsPane />
      </div>
    </main>
  );
}
