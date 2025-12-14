import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: ReactNode;
  isDemo?: boolean;
}

function AppLayoutContent({ children, isDemo = false }: AppLayoutProps) {
  useKeyboardShortcuts(isDemo);
  const { collapsed } = useSidebarContext();
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isDemo={isDemo} />
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppLayout({ children, isDemo = false }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent isDemo={isDemo}>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  );
}
