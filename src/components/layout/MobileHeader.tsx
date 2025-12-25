import { Menu } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';

export function MobileHeader() {
  const { setMobileOpen } = useSidebarContext();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-card border-b border-border flex items-center px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="text-foreground"
      >
        <Menu size={24} />
      </Button>
      <h1 className="font-serif text-2xl font-semibold tracking-wide text-foreground ml-3">
        BEAU
      </h1>
    </header>
  );
}
