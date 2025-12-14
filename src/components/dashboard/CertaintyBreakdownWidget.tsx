import { CheckCircle2, FileText, TrendingUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CERTAINTY_LEVELS } from '@/lib/certainty';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CertaintyBreakdown {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
}

interface CertaintyBreakdownWidgetProps {
  assetsBreakdown: CertaintyBreakdown;
  liabilitiesBreakdown: CertaintyBreakdown;
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

const certaintyConfig = {
  certain: { 
    icon: CheckCircle2, 
    label: 'Verified', 
    shortLabel: '✓',
    color: 'bg-positive', 
    textColor: 'text-positive',
    bgColor: 'bg-positive/10',
    borderColor: 'border-positive/20',
    description: 'Confirmed values with documentation'
  },
  contractual: { 
    icon: FileText, 
    label: 'Committed', 
    shortLabel: '📄',
    color: 'bg-primary', 
    textColor: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    description: 'Legally binding but future'
  },
  probable: { 
    icon: TrendingUp, 
    label: 'Estimated', 
    shortLabel: '~',
    color: 'bg-warning', 
    textColor: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    description: 'High likelihood but not guaranteed'
  },
  optional: { 
    icon: HelpCircle, 
    label: 'Speculative', 
    shortLabel: '?',
    color: 'bg-muted-foreground/50', 
    textColor: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    description: 'Possible but uncertain'
  },
};

export function CertaintyBreakdownWidget({
  assetsBreakdown,
  liabilitiesBreakdown,
  currency,
  isBlurred = false,
  delay = 0,
}: CertaintyBreakdownWidgetProps) {
  const symbol = currencySymbols[currency] || `${currency} `;

  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  // Calculate net values per certainty level
  const netByLevel = {
    certain: assetsBreakdown.certain - liabilitiesBreakdown.certain,
    contractual: assetsBreakdown.contractual - liabilitiesBreakdown.contractual,
    probable: assetsBreakdown.probable - liabilitiesBreakdown.probable,
    optional: assetsBreakdown.optional - liabilitiesBreakdown.optional,
  };

  const totalAssets = Object.values(assetsBreakdown).reduce((a, b) => a + b, 0);
  const totalNet = Object.values(netByLevel).reduce((a, b) => a + b, 0);

  // Calculate percentages for the bar
  const getPercentage = (value: number) => {
    if (totalAssets === 0) return 0;
    return (value / totalAssets) * 100;
  };

  // Check if we have any non-certain values
  const hasNonCertain = assetsBreakdown.contractual > 0 || 
                        assetsBreakdown.probable > 0 || 
                        assetsBreakdown.optional > 0 ||
                        liabilitiesBreakdown.contractual > 0 ||
                        liabilitiesBreakdown.probable > 0 ||
                        liabilitiesBreakdown.optional > 0;

  // Don't show if everything is certain
  if (!hasNonCertain) return null;

  const confirmedNet = netByLevel.certain + netByLevel.contractual;
  const projectedNet = netByLevel.probable + netByLevel.optional;

  return (
    <TooltipProvider>
      <div 
        className="animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <h3 className="font-serif text-lg font-medium text-foreground mb-4">Certainty Breakdown</h3>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-positive/10 border border-positive/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-positive" />
              <span className="text-sm font-medium text-foreground">Confirmed</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xl font-serif font-medium text-foreground tabular-nums cursor-help">
                  {isBlurred ? '•••••' : `${symbol}${formatValue(confirmedNet)}`}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Verified + Committed values</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Projected</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xl font-serif font-medium text-foreground tabular-nums cursor-help">
                  {isBlurred ? '•••••' : `+${symbol}${formatValue(projectedNet)}`}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated + Speculative values</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stacked Bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-4">
          {(['certain', 'contractual', 'probable', 'optional'] as const).map((level) => {
            const percentage = getPercentage(assetsBreakdown[level]);
            if (percentage <= 0) return null;
            return (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn("h-full transition-all duration-500 cursor-help", certaintyConfig[level].color)}
                    style={{ width: `${percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{certaintyConfig[level].label}: {percentage.toFixed(0)}%</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['certain', 'contractual', 'probable', 'optional'] as const).map((level) => {
            const config = certaintyConfig[level];
            const Icon = config.icon;
            const assetValue = assetsBreakdown[level];
            const liabilityValue = liabilitiesBreakdown[level];
            const netValue = netByLevel[level];
            
            // Skip if no values
            if (assetValue === 0 && liabilityValue === 0) return null;
            
            return (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "p-3 rounded-lg border cursor-help",
                    config.bgColor,
                    config.borderColor
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className={config.textColor} />
                      <span className="text-xs font-medium text-foreground">{config.label}</span>
                    </div>
                    <div className="text-sm font-medium tabular-nums text-foreground">
                      {isBlurred ? '•••••' : `${symbol}${formatValue(netValue)}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {getPercentage(assetValue).toFixed(0)}% of assets
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs space-y-1">
                    <p>{config.description}</p>
                    <p className="text-positive">Assets: {symbol}{formatValue(assetValue)}</p>
                    {liabilityValue > 0 && (
                      <p className="text-destructive">Liabilities: -{symbol}{formatValue(liabilityValue)}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
