import { NavLink, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Gem, 
  Plus, 
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  LogIn,
  Building,
  Handshake,
  FileText,
  TrendingDown,
  Scale
} from 'lucide-react';

interface SidebarProps {
  isDemo?: boolean;
}

const portfolioNavigation = [
  { name: 'Dashboard', href: '/', demoHref: '/demo', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', demoHref: '/demo/assets', icon: Wallet },
  { name: 'Collections', href: '/collections', demoHref: '/demo/collections', icon: Gem },
  { name: 'Liabilities', href: '/liabilities', demoHref: '/demo/liabilities', icon: TrendingDown },
  { name: 'Receivables', href: '/receivables', demoHref: '/demo/receivables', icon: Handshake },
];

const managementNavigation = [
  { name: 'Entities', href: '/entities', demoHref: '/demo/entities', icon: Building },
  { name: 'Documents', href: '/documents', demoHref: '/demo/documents', icon: FileText },
  { name: 'Balance Sheet', href: '/balance-sheet', demoHref: '/demo/balance-sheet', icon: Scale },
];

const actionsNavigation = [
  { name: 'Add Asset', href: '/add', demoHref: '/demo/add', icon: Plus },
  { name: 'Add Liability', href: '/add-liability', demoHref: '/demo/add-liability', icon: TrendingDown },
];


export function Sidebar({ isDemo = false }: SidebarProps) {
  const { collapsed, toggle } = useSidebarContext();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const displayName = isDemo 
    ? 'Lucas Soleil' 
    : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
  const displayEmail = isDemo ? 'demo@beau.app' : user?.email;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-[200px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <h1 className="font-serif text-3xl font-semibold tracking-wide text-foreground">
              BEAU
            </h1>
          )}
          {collapsed && (
            <span className="font-serif text-2xl font-semibold text-foreground">B</span>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {/* Portfolio Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Portfolio
              </p>
            )}
            {portfolioNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={isDemo ? item.demoHref : item.href}
                end={item.href === '/' || item.demoHref === '/demo'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                    collapsed && "justify-center hover:translate-x-0 hover:scale-105"
                  )
                }
              >
                <item.icon size={20} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Management Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Management
              </p>
            )}
            {managementNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={isDemo ? item.demoHref : item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                    collapsed && "justify-center hover:translate-x-0 hover:scale-105"
                  )
                }
              >
                <item.icon size={20} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Actions Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </p>
            )}
            {actionsNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={isDemo ? item.demoHref : item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                    collapsed && "justify-center hover:translate-x-0 hover:scale-105"
                  )
                }
              >
                <item.icon size={20} strokeWidth={1.5} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </NavLink>
            ))}
          </div>

        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <NavLink
            to={isDemo ? "/demo/settings" : "/settings"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                collapsed && "justify-center hover:translate-x-0 hover:scale-105"
              )
            }
          >
            <Settings size={20} strokeWidth={1.5} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sidebar-foreground",
            collapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User size={16} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </div>
            )}
          </div>

          {isDemo ? (
            <Link
              to="/auth"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out w-full text-primary hover:bg-sidebar-accent hover:translate-x-1",
                collapsed && "justify-center hover:translate-x-0 hover:scale-105"
              )}
            >
              <LogIn size={20} strokeWidth={1.5} />
              {!collapsed && <span>Sign Up / Login</span>}
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-out w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                collapsed && "justify-center hover:translate-x-0 hover:scale-105"
              )}
            >
              <LogOut size={20} strokeWidth={1.5} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
