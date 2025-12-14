import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const COLLAPSED_STORAGE_KEY = 'dashboard-collapsed-sections';

const getCollapsedState = (): string[] => {
  try {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCollapsedState = (collapsed: string[]) => {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  } catch {
    // Ignore storage errors
  }
};

// Context for coordinating expand/collapse all
interface CollapsibleContextType {
  registerSection: (id: string) => void;
  unregisterSection: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  allExpanded: boolean;
  allCollapsed: boolean;
  sectionStates: Record<string, boolean>;
  setSectionState: (id: string, isOpen: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null);

export function CollapsibleProvider({ children }: { children: React.ReactNode }) {
  const [registeredSections, setRegisteredSections] = useState<string[]>([]);
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>(() => {
    const collapsed = getCollapsedState();
    const states: Record<string, boolean> = {};
    collapsed.forEach(id => { states[id] = false; });
    return states;
  });

  const registerSection = useCallback((id: string) => {
    setRegisteredSections(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const unregisterSection = useCallback((id: string) => {
    setRegisteredSections(prev => prev.filter(s => s !== id));
  }, []);

  const setSectionState = useCallback((id: string, isOpen: boolean) => {
    setSectionStates(prev => {
      const newStates = { ...prev, [id]: isOpen };
      // Save to localStorage
      const collapsed = Object.entries(newStates)
        .filter(([_, open]) => !open)
        .map(([id]) => id);
      saveCollapsedState(collapsed);
      return newStates;
    });
  }, []);

  const expandAll = useCallback(() => {
    const newStates: Record<string, boolean> = {};
    registeredSections.forEach(id => { newStates[id] = true; });
    setSectionStates(newStates);
    saveCollapsedState([]);
  }, [registeredSections]);

  const collapseAll = useCallback(() => {
    const newStates: Record<string, boolean> = {};
    registeredSections.forEach(id => { newStates[id] = false; });
    setSectionStates(newStates);
    saveCollapsedState(registeredSections);
  }, [registeredSections]);

  const allExpanded = registeredSections.length > 0 && 
    registeredSections.every(id => sectionStates[id] === true);
  const allCollapsed = registeredSections.length > 0 && 
    registeredSections.every(id => sectionStates[id] === false || sectionStates[id] === undefined);

  return (
    <CollapsibleContext.Provider value={{
      registerSection,
      unregisterSection,
      expandAll,
      collapseAll,
      allExpanded,
      allCollapsed,
      sectionStates,
      setSectionState,
    }}>
      {children}
    </CollapsibleContext.Provider>
  );
}

export function useCollapsibleContext() {
  return useContext(CollapsibleContext);
}

export function ExpandCollapseAllButton() {
  const context = useCollapsibleContext();
  
  if (!context) return null;

  const { allExpanded, expandAll, collapseAll } = context;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={allExpanded ? collapseAll : expandAll}
      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ChevronsUpDown size={14} />
      {allExpanded ? 'Collapse All' : 'Expand All'}
    </Button>
  );
}

interface CollapsibleSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  id,
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const context = useCollapsibleContext();
  
  // Get initial state from context or localStorage
  const getInitialState = () => {
    if (context?.sectionStates[id] !== undefined) {
      return context.sectionStates[id];
    }
    const collapsed = getCollapsedState();
    if (collapsed.includes(id)) return false;
    if (localStorage.getItem(COLLAPSED_STORAGE_KEY) && !collapsed.includes(id)) {
      return true;
    }
    return defaultOpen;
  };

  const [localIsOpen, setLocalIsOpen] = useState(getInitialState);
  
  // Use context state if available, otherwise use local state
  const isOpen = context?.sectionStates[id] ?? localIsOpen;

  useEffect(() => {
    context?.registerSection(id);
    return () => context?.unregisterSection(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleOpen = () => {
    const newState = !isOpen;
    if (context) {
      context.setSectionState(id, newState);
    } else {
      setLocalIsOpen(newState);
      // Save to localStorage for standalone usage
      const collapsed = getCollapsedState();
      if (newState) {
        saveCollapsedState(collapsed.filter(s => s !== id));
      } else {
        if (!collapsed.includes(id)) {
          saveCollapsedState([...collapsed, id]);
        }
      }
    }
  };

  return (
    <div className={cn('animate-fade-in', className)}>
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-3 px-1 text-left group hover:bg-secondary/30 rounded-md transition-colors -mx-1"
      >
        <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {isOpen ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </span>
      </button>
      
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

