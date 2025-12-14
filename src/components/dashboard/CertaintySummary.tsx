import { CheckCircle2, FileText, TrendingUp, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CertaintySummaryProps {
  assetsBreakdown: {
    certain: number;
    contractual: number;
    probable: number;
    optional: number;
  };
  totalAssets: number;
  className?: string;
}

export function CertaintySummary({ assetsBreakdown, totalAssets, className }: CertaintySummaryProps) {
  if (totalAssets === 0) return null;

  const confirmed = assetsBreakdown.certain + assetsBreakdown.contractual;
  const estimated = assetsBreakdown.probable + assetsBreakdown.optional;
  
  const confirmedPercent = Math.round((confirmed / totalAssets) * 100);
  const estimatedPercent = 100 - confirmedPercent;

  // Calculate individual percentages for tooltip
  const certainPercent = Math.round((assetsBreakdown.certain / totalAssets) * 100);
  const contractualPercent = Math.round((assetsBreakdown.contractual / totalAssets) * 100);
  const probablePercent = Math.round((assetsBreakdown.probable / totalAssets) * 100);
  const optionalPercent = Math.round((assetsBreakdown.optional / totalAssets) * 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50 cursor-default", className)}>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-positive" />
            <span className="text-xs font-medium text-foreground">{confirmedPercent}%</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-warning" />
            <span className="text-xs font-medium text-muted-foreground">{estimatedPercent}%</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-48">
        <p className="font-medium mb-2 text-xs">Portfolio Certainty</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-positive" />
              Verified
            </span>
            <span className="tabular-nums">{certainPercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText size={10} className="text-primary" />
              Committed
            </span>
            <span className="tabular-nums">{contractualPercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp size={10} className="text-warning" />
              Estimated
            </span>
            <span className="tabular-nums">{probablePercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <HelpCircle size={10} className="text-muted-foreground" />
              Speculative
            </span>
            <span className="tabular-nums">{optionalPercent}%</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
