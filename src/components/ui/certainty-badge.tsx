import { CheckCircle2, FileText, TrendingUp, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CertaintyBadgeProps {
  certainty: string | null | undefined;
  className?: string;
  showLabel?: boolean;
}

const certaintyConfig: Record<string, { 
  icon: typeof CheckCircle2; 
  label: string; 
  colorClass: string;
}> = {
  certain: { 
    icon: CheckCircle2, 
    label: 'Verified', 
    colorClass: 'text-positive border-positive/30 bg-positive/10'
  },
  contractual: { 
    icon: FileText, 
    label: 'Committed', 
    colorClass: 'text-primary border-primary/30 bg-primary/10'
  },
  probable: { 
    icon: TrendingUp, 
    label: 'Estimated', 
    colorClass: 'text-warning border-warning/30 bg-warning/10'
  },
  optional: { 
    icon: HelpCircle, 
    label: 'Speculative', 
    colorClass: 'text-muted-foreground border-border bg-muted/50'
  },
};

export function CertaintyBadge({ certainty, className, showLabel = true }: CertaintyBadgeProps) {
  // Don't show badge for 'certain' - it's the default
  if (!certainty || certainty === 'certain') return null;
  
  const config = certaintyConfig[certainty];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-normal gap-1", config.colorClass, className)}
    >
      <Icon size={10} />
      {showLabel && config.label}
    </Badge>
  );
}
