import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { navigationItems, type WorkspaceSection } from './navigation';

interface AppSidebarProps {
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-11 h-[calc(100svh-2.75rem)] border-sidebar-border"
    >
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            workspace
          </span>
          <span className="font-mono text-[0.62rem] text-sidebar-foreground/35">
            v0.1
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-status-success shadow-[0_0_0_3px_var(--status-success-soft)]"
          />
          <span className="truncate font-mono text-xs text-sidebar-foreground/80">
            local / default
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-4 w-auto" />

      <SidebarContent>
        <SidebarGroup className="p-4 pt-5">
          <SidebarGroupLabel className="h-auto px-2 pb-2 pt-0 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-sidebar-foreground/35">
            navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.label;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      type="button"
                      isActive={isActive}
                      tooltip={item.description}
                      onClick={() => onSectionChange(item.label)}
                      className="relative h-9 rounded-none border-l-2 border-transparent px-2.5 text-sidebar-foreground/65 data-[active=true]:border-status-success data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-sidebar-foreground/35">
              transport
            </p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/70">
              mock service
            </p>
          </div>
          <span className="size-1.5 shrink-0 rounded-full bg-status-success" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
