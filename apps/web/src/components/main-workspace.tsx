import type { MessagesApi } from '@msgdock/contracts';

import type { WorkspaceSection } from '@/components/navigation';
import { WorkspaceEmptyState } from '@/components/workspace-empty-state';
import { MessageInbox } from '@/features/messages/message-inbox';

interface MainWorkspaceProps {
  activeSection: WorkspaceSection;
  api: MessagesApi;
}

function isMessageSection(
  section: WorkspaceSection,
): section is Extract<WorkspaceSection, 'Overview' | 'Email' | 'SMS'> {
  return section === 'Overview' || section === 'Email' || section === 'SMS';
}

export function MainWorkspace({ activeSection, api }: MainWorkspaceProps) {
  const messageSection = isMessageSection(activeSection);
  const contextLabel = messageSection
    ? `capture stream / ${activeSection === 'Overview' ? 'all channels' : activeSection}`
    : `workspace / ${activeSection}`;
  const pageTitle = messageSection ? 'Messages' : activeSection;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-border px-5 py-4 md:px-7 md:py-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground/55">
            {contextLabel.toLowerCase()}
          </p>
          <h1 className="mt-2 font-heading text-xl font-medium tracking-tight text-foreground md:text-2xl">
            {pageTitle}
          </h1>
        </div>
        {messageSection ? (
          <div className="hidden items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground/45 sm:flex">
            <span className="size-1.5 rounded-full bg-status-success" />
            api-backed
          </div>
        ) : null}
      </div>

      {messageSection ? (
        <MessageInbox activeSection={activeSection} api={api} />
      ) : (
        <WorkspaceEmptyState section={activeSection} />
      )}
    </main>
  );
}
