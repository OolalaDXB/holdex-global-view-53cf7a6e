import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import { CERTAINTY_LEVELS, CertaintyLevel } from '@/lib/certainty';

interface CertaintySelectProps {
  value: string;
  onValueChange: (value: CertaintyLevel) => void;
  showLabel?: boolean;
}

export function CertaintySelect({ value, onValueChange, showLabel = false }: CertaintySelectProps) {
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          <Label>Certainty</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px]">
                <p className="text-sm">How confident are you in this valuation? This helps calculate your conservative vs optimistic net worth.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CERTAINTY_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              <span className="flex items-center gap-2">
                <span className="text-xs w-4 text-center">{level.icon}</span>
                <span>{level.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
