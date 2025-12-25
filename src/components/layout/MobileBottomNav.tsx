import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Plus, Settings, MoreHorizontal, Scale, Landmark, Users, FileText, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface MobileBottomNavProps {
  isDemo?: boolean;
}

export function MobileBottomNav({ isDemo = false }: MobileBottomNavProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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
      name: 'Settings', 
      href: isDemo ? '/demo/settings' : '/settings', 
      icon: Settings 
    },
    { 
      name: 'More', 
      href: '#more',
      icon: MoreHorizontal,
      isMore: true
    },
  ];

  const moreItems = [
    { 
      name: 'Liabilities', 
      href: isDemo ? '/demo/liabilities' : '/liabilities', 
      icon: Landmark,
      description: 'Manage loans & debts'
    },
    { 
      name: 'Receivables', 
      href: isDemo ? '/demo/receivables' : '/receivables', 
      icon: Receipt,
      description: 'Track money owed to you'
    },
    { 
      name: 'Entities', 
      href: isDemo ? '/demo/entities' : '/entities', 
      icon: Users,
      description: 'Manage ownership structures'
    },
    { 
      name: 'Documents', 
      href: isDemo ? '/demo/documents' : '/documents', 
      icon: FileText,
      description: 'Store important files'
    },
    { 
      name: 'Balance Sheet', 
      href: isDemo ? '/demo/balance-sheet' : '/balance-sheet', 
      icon: Scale,
      description: 'Financial statements'
    },
  ];

  const addItems = [
    { 
      name: 'Add Asset', 
      href: isDemo ? '/demo/add' : '/add', 
      icon: Wallet,
      description: 'Real estate, investments, etc.'
    },
    { 
      name: 'Add Liability', 
      href: isDemo ? '/demo/add-liability' : '/add-liability', 
      icon: Landmark,
      description: 'Loans, mortgages, debts'
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            
            if (item.isAction) {
              return (
                <Drawer key={item.name} open={addOpen} onOpenChange={setAddOpen}>
                  <DrawerTrigger asChild>
                    <button className="flex flex-col items-center justify-center -mt-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <item.icon size={24} className="text-primary-foreground" />
                      </div>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Add New</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-8 space-y-2">
                      {addItems.map((addItem) => (
                        <NavLink
                          key={addItem.name}
                          to={addItem.href}
                          onClick={() => setAddOpen(false)}
                          className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <addItem.icon size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{addItem.name}</p>
                            <p className="text-sm text-muted-foreground">{addItem.description}</p>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              );
            }

            if (item.isMore) {
              return (
                <Drawer key={item.name} open={moreOpen} onOpenChange={setMoreOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                        moreOpen 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon size={22} strokeWidth={moreOpen ? 2 : 1.5} />
                      <span className="text-[10px] font-medium">{item.name}</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>More</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-8 space-y-2">
                      {moreItems.map((moreItem) => (
                        <NavLink
                          key={moreItem.name}
                          to={moreItem.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg transition-colors",
                            isActive(moreItem.href) 
                              ? "bg-primary/10 text-primary" 
                              : "bg-secondary/50 hover:bg-secondary text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isActive(moreItem.href) ? "bg-primary/20" : "bg-muted"
                          )}>
                            <moreItem.icon size={20} className={isActive(moreItem.href) ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div>
                            <p className="font-medium">{moreItem.name}</p>
                            <p className="text-sm text-muted-foreground">{moreItem.description}</p>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
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
    </>
  );
}
