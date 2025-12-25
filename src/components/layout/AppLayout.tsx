import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from './PageTransition';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: ReactNode;
  isDemo?: boolean;
}

function AppLayoutContent({ children, isDemo = false }: AppLayoutProps) {
  const { collapsed, isMobile } = useSidebarContext();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isDemo={isDemo} />
      {isMobile && <MobileHeader />}
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isMobile ? "ml-0 pt-14 pb-20" : collapsed ? "ml-16" : "ml-[200px]"
        )}
      >
        <div className="min-h-screen">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </div>
      </main>
      {isMobile && <MobileBottomNav isDemo={isDemo} />}
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
