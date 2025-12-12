import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

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

export function CollapsibleSection({
  id,
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const collapsed = getCollapsedState();
    // If explicitly collapsed in storage, honor that
    if (collapsed.includes(id)) return false;
    // If explicitly NOT in collapsed list but we have storage, it was expanded
    if (localStorage.getItem(COLLAPSED_STORAGE_KEY) && !collapsed.includes(id)) {
      return true;
    }
    // Otherwise use default
    return defaultOpen;
  });

  useEffect(() => {
    const collapsed = getCollapsedState();
    if (isOpen) {
      // Remove from collapsed list
      saveCollapsedState(collapsed.filter(s => s !== id));
    } else {
      // Add to collapsed list
      if (!collapsed.includes(id)) {
        saveCollapsedState([...collapsed, id]);
      }
    }
  }, [isOpen, id]);

  return (
    <div className={cn('animate-fade-in', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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

