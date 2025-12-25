import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/assets': 'Assets',
  '/add': 'Add Asset',
  '/add-liability': 'Add Liability',
  '/liabilities': 'Liabilities',
  '/receivables': 'Receivables',
  '/entities': 'Entities',
  '/documents': 'Documents',
  '/collections': 'Collections',
  '/balance-sheet': 'Balance Sheet',
  '/settings': 'Settings',
  // Demo routes
  '/demo': 'Dashboard',
  '/demo/assets': 'Assets',
  '/demo/add': 'Add Asset',
  '/demo/add-liability': 'Add Liability',
  '/demo/liabilities': 'Liabilities',
  '/demo/receivables': 'Receivables',
  '/demo/entities': 'Entities',
  '/demo/documents': 'Documents',
  '/demo/collections': 'Collections',
  '/demo/balance-sheet': 'Balance Sheet',
  '/demo/settings': 'Settings',
};

export function MobileHeader() {
  const { setMobileOpen } = useSidebarContext();
  const location = useLocation();
  
  const pageTitle = PAGE_TITLES[location.pathname] || 'BEAU';

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
      <h1 className="font-serif text-xl font-semibold tracking-wide text-foreground ml-3">
        {pageTitle}
      </h1>
    </header>
  );
}
