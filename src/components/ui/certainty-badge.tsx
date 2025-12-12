import { Badge } from '@/components/ui/badge';
import { getCertaintyBadge } from '@/lib/certainty';
import { cn } from '@/lib/utils';

interface CertaintyBadgeProps {
  certainty: string | null | undefined;
  className?: string;
}

export function CertaintyBadge({ certainty, className }: CertaintyBadgeProps) {
  const badge = getCertaintyBadge(certainty || null);
  
  if (!badge) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-normal", className)}
    >
      {badge.icon && <span className="mr-1">{badge.icon}</span>}
      {badge.label}
    </Badge>
  );
}
