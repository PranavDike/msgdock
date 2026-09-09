import { useState } from 'react';

import './App.css';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { MainWorkspace } from '@/components/main-workspace';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { WorkspaceSection } from '@/components/navigation';

function App() {
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>('Overview');

  return (
    <SidebarProvider defaultOpen className="min-h-svh flex-col">
      <AppHeader />
      <div className="flex min-h-0 w-full flex-1">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <SidebarInset className="min-h-0 overflow-hidden bg-background">
          <MainWorkspace activeSection={activeSection} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;
