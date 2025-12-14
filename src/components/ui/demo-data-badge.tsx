import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoDataBadgeProps {
  label?: string;
  className?: string;
}

export function DemoDataBadge({ 
  label = 'Using demo data', 
  className 
}: DemoDataBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      <Database size={12} className="text-primary/60" />
      <span>{label}</span>
    </div>
  );
}
