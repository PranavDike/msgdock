import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Settings2,
} from 'lucide-react';

export type WorkspaceSection =
  'Overview' | 'Email' | 'SMS' | 'Providers' | 'Settings';

export interface NavigationItem {
  label: WorkspaceSection;
  icon: LucideIcon;
  description: string;
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'All captured communication',
  },
  {
    label: 'Email',
    icon: Mail,
    description: 'Captured email traffic',
  },
  {
    label: 'SMS',
    icon: MessageSquareText,
    description: 'Captured SMS traffic',
  },
  {
    label: 'Providers',
    icon: Boxes,
    description: 'Local provider adapters',
  },
  {
    label: 'Settings',
    icon: Settings2,
    description: 'Workspace preferences',
  },
];
