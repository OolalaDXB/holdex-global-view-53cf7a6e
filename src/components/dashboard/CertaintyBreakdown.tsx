import { cn } from '@/lib/utils';
import { CheckCircle2, FileText, TrendingUp, HelpCircle } from 'lucide-react';

interface CertaintyBreakdown {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
}

interface CertaintyBreakdownProps {
  assetsBreakdown: CertaintyBreakdown;
  liabilitiesBreakdown: CertaintyBreakdown;
  delay?: number;
  isBlurred?: boolean;
}

const certaintyConfig = [
  { 
    key: 'certain' as const,
    icon: CheckCircle2, 
    label: 'Verified', 
    shortLabel: '✓',
    barColor: 'bg-emerald-500',
  },
  { 
    key: 'contractual' as const,
    icon: FileText, 
    label: 'Committed', 
    shortLabel: '📄',
    barColor: 'bg-sky-500',
  },
  { 
    key: 'probable' as const,
    icon: TrendingUp, 
    label: 'Estimated', 
    shortLabel: '~',
    barColor: 'bg-amber-500',
  },
  { 
    key: 'optional' as const,
    icon: HelpCircle, 
    label: 'Speculative', 
    shortLabel: '?',
    barColor: 'bg-slate-400',
  },
];

export function CertaintyBreakdown({ 
  assetsBreakdown, 
  liabilitiesBreakdown,
  delay = 0, 
  isBlurred = false 
}: CertaintyBreakdownProps) {
  // Calculate net values per certainty level
  const netByLevel = {
    certain: assetsBreakdown.certain - liabilitiesBreakdown.certain,
    contractual: assetsBreakdown.contractual - liabilitiesBreakdown.contractual,
    probable: assetsBreakdown.probable - liabilitiesBreakdown.probable,
    optional: assetsBreakdown.optional - liabilitiesBreakdown.optional,
  };

  const totalAssets = Object.values(assetsBreakdown).reduce((a, b) => a + b, 0);
  
  // Calculate percentages based on gross assets
  const getPercentage = (value: number) => {
    if (totalAssets === 0) return 0;
    return (value / totalAssets) * 100;
  };

  // Filter out items with 0%
  const items = certaintyConfig
    .map(config => ({
      ...config,
      value: assetsBreakdown[config.key],
      percentage: getPercentage(assetsBreakdown[config.key]),
    }))
    .filter(item => item.percentage > 0);

  if (items.length === 0) return null;

  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.shortLabel}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {isBlurred ? '•••' : `${item.percentage.toFixed(0)}%`}
                </span>
              </div>
              <div className="stat-bar">
                <div 
                  className={cn("stat-bar-fill", item.barColor)}
                  style={{ 
                    width: `${item.percentage}%`,
                    transitionDelay: `${delay + (index * 100)}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
