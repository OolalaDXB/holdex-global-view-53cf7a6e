import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  isDemo?: boolean;
}

export function AppLayout({ children, isDemo = false }: AppLayoutProps) {
  useKeyboardShortcuts(isDemo);
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isDemo={isDemo} />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
