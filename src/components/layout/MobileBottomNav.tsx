import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Plus, Gem, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  isDemo?: boolean;
}

export function MobileBottomNav({ isDemo = false }: MobileBottomNavProps) {
  const location = useLocation();

  const navItems = [
    { 
      name: 'Dashboard', 
      href: isDemo ? '/demo' : '/', 
      icon: LayoutDashboard,
      exact: true
    },
    { 
      name: 'Assets', 
      href: isDemo ? '/demo/assets' : '/assets', 
      icon: Wallet 
    },
    { 
      name: 'Add', 
      href: isDemo ? '/demo/add' : '/add', 
      icon: Plus,
      isAction: true
    },
    { 
      name: 'Collections', 
      href: isDemo ? '/demo/collections' : '/collections', 
      icon: Gem 
    },
    { 
      name: 'Settings', 
      href: isDemo ? '/demo/settings' : '/settings', 
      icon: Settings 
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          
          if (item.isAction) {
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <item.icon size={24} className="text-primary-foreground" />
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
