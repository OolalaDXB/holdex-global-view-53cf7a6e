import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertaintyBreakdownWidgetProps {
  confirmedValue: number;
  projectedValue: number;
  currency: string;
  isBlurred?: boolean;
  delay?: number;
}

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  AED: 'AED',
  GBP: '£',
  CHF: 'Fr.',
  RUB: '₽',
};

export function CertaintyBreakdownWidget({
  confirmedValue,
  projectedValue,
  currency,
  isBlurred = false,
  delay = 0,
}: CertaintyBreakdownWidgetProps) {
  const total = confirmedValue + projectedValue;
  const confirmedPercentage = total > 0 ? (confirmedValue / total) * 100 : 0;
  const projectedPercentage = total > 0 ? (projectedValue / total) * 100 : 0;

  const symbol = currencySymbols[currency] || `${currency} `;

  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  // Don't show if there's nothing projected
  if (projectedValue <= 0) return null;

  return (
    <div 
      className="animate-fade-in mb-12 pb-12 border-b border-border"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="font-serif text-lg font-medium text-foreground mb-6">Certainty Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confirmed */}
        <div className="p-4 rounded-lg bg-positive/10 border border-positive/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-positive" />
            <span className="text-sm font-medium text-foreground">Confirmed</span>
            <span className="text-xs text-muted-foreground">(Certain + Likely)</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-medium text-foreground tabular-nums">
              {isBlurred ? '•••••' : `${symbol}${formatValue(confirmedValue)}`}
            </span>
            <span className="text-lg font-medium text-positive">
              {confirmedPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="mt-3 h-2 bg-positive/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-positive rounded-full transition-all duration-500"
              style={{ width: `${confirmedPercentage}%` }}
            />
          </div>
        </div>

        {/* Projected */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Projected</span>
            <span className="text-xs text-muted-foreground">(Optional + Uncertain)</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-medium text-foreground tabular-nums">
              {isBlurred ? '•••••' : `${symbol}${formatValue(projectedValue)}`}
            </span>
            <span className="text-lg font-medium text-muted-foreground">
              {projectedPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/50 rounded-full transition-all duration-500"
              style={{ width: `${projectedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-positive" />
          <span>Certain: Verified values</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-positive/60" />
          <span>Likely: High confidence estimates</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span>Optional: May not materialize</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span>Uncertain: Speculative</span>
        </div>
      </div>
    </div>
  );
}
