import { Boxes, Settings2 } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import type { WorkspaceSection } from '@/components/navigation';

interface WorkspaceEmptyStateProps {
  section: Extract<WorkspaceSection, 'Providers' | 'Settings'>;
}

const content = {
  Providers: {
    eyebrow: 'provider registry',
    title: 'No providers configured',
    description:
      'Provider adapters will appear here when the local transport exposes them.',
    Icon: Boxes,
  },
  Settings: {
    eyebrow: 'workspace settings',
    title: 'Nothing to configure yet',
    description:
      'Workspace preferences will appear here as local runtime controls are added.',
    Icon: Settings2,
  },
} as const;

export function WorkspaceEmptyState({ section }: WorkspaceEmptyStateProps) {
  const state = content[section];
  const Icon = state.Icon;

  return (
    <div className="flex min-h-0 flex-1">
      <Empty className="min-h-full rounded-none border-0 p-8">
        <EmptyMedia
          variant="icon"
          className="size-10 rounded-sm border border-border bg-muted/30 text-muted-foreground"
        >
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground/50">
            {state.eyebrow}
          </p>
          <EmptyTitle className="font-mono text-sm font-medium tracking-tight">
            {state.title}
          </EmptyTitle>
          <EmptyDescription className="max-w-sm text-xs leading-5 text-muted-foreground/70">
            {state.description}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
