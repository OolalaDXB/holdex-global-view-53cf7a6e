import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DemoDataBadgeProps {
  label?: string;
  className?: string;
}

export function DemoDataBadge({ 
  label = 'Using demo data', 
  className 
}: DemoDataBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground cursor-help",
            className
          )}>
            <Database size={12} className="text-primary/60" />
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">Demo data is static and doesn't update in real-time like live data.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
