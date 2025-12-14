import { TrendingUp, TrendingDown, Wallet, Scale, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NetWorthCardProps {
  totalValue: number;
  grossAssets: number;
  totalLiabilities: number;
  change: number;
  currency?: string;
  isBlurred?: boolean;
}

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  AED: 'AED ',
  GBP: '£',
  CHF: 'Fr.',
  RUB: '₽',
};

export function NetWorthCard({ 
  totalValue, 
  grossAssets,
  totalLiabilities,
  change, 
  currency = 'EUR', 
  isBlurred = false 
}: NetWorthCardProps) {
  const isPositive = change >= 0;
  const symbol = currencySymbols[currency] || `${currency} `;
  
  // Debt-to-Asset ratio = Total Liabilities / Gross Assets
  const debtToAssetRatio = grossAssets > 0 ? (totalLiabilities / grossAssets) * 100 : 0;
  const isHealthyRatio = debtToAssetRatio < 50;
  
  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  return (
    <div className="animate-fade-in">
      <p className="wealth-label mb-2">Net Worth</p>
      <div className="flex items-baseline gap-4">
        <h2 className="wealth-value text-foreground">
          {isBlurred ? '•••••' : `${totalValue < 0 ? '-' : ''}${symbol}${formatValue(totalValue)}`}
        </h2>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isPositive ? "text-positive" : "text-negative"
        )}>
          {isPositive ? (
            <TrendingUp size={16} strokeWidth={1.5} />
          ) : (
            <TrendingDown size={16} strokeWidth={1.5} />
          )}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}% MTD</span>
        </div>
      </div>
      
      {/* Breakdown row */}
      {!isBlurred && (
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet size={14} />
                <span className="tabular-nums">{symbol}{formatValue(grossAssets)}</span>
                <span className="text-xs">gross</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total assets before subtracting liabilities</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-foreground">
                <Scale size={14} />
                <span className="tabular-nums">{symbol}{formatValue(totalValue)}</span>
                <span className="text-xs">net</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gross assets minus all liabilities</p>
            </TooltipContent>
          </Tooltip>

          {totalLiabilities > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1.5",
                  isHealthyRatio ? "text-muted-foreground" : "text-warning"
                )}>
                  <Percent size={14} />
                  <span className="tabular-nums">{debtToAssetRatio.toFixed(0)}%</span>
                  <span className="text-xs">debt ratio</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Debt-to-Asset ratio: {symbol}{formatValue(totalLiabilities)} liabilities ÷ {symbol}{formatValue(grossAssets)} assets</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {debtToAssetRatio < 30 ? 'Conservative leverage' : 
                   debtToAssetRatio < 50 ? 'Moderate leverage' : 
                   debtToAssetRatio < 70 ? 'High leverage' : 'Very high leverage'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
