import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

interface NetWorthCardProps {
  totalValue: number;
  grossAssets: number;
  totalLiabilities: number;
  change: number;
  grossChange?: number;
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

const STORAGE_KEY = 'holdex-gross-net-view';

export function NetWorthCard({ 
  totalValue, 
  grossAssets,
  totalLiabilities,
  change,
  grossChange,
  currency = 'EUR', 
  isBlurred = false 
}: NetWorthCardProps) {
  const [showGross, setShowGross] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'gross';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, showGross ? 'gross' : 'net');
  }, [showGross]);

  const displayValue = showGross ? grossAssets : totalValue;
  const displayChange = showGross ? (grossChange ?? change) : change;
  const isPositive = displayChange >= 0;
  const symbol = currencySymbols[currency] || `${currency} `;
  
  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="wealth-label">Net Worth</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setShowGross(!showGross)}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <span className={cn(
                "text-xs transition-colors",
                showGross ? "text-foreground font-medium" : "text-muted-foreground"
              )}>Gross</span>
              <div className={cn(
                "relative w-8 h-4 rounded-full transition-colors",
                "bg-secondary border border-border"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-primary transition-all duration-200",
                  showGross ? "left-0.5" : "left-[calc(100%-14px)]"
                )} />
              </div>
              <span className={cn(
                "text-xs transition-colors",
                !showGross ? "text-foreground font-medium" : "text-muted-foreground"
              )}>Net</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gross = total assets before debt</p>
            <p>Net = assets minus liabilities</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-4">
        <h2 className="wealth-value text-foreground">
          {isBlurred ? '•••••' : `${displayValue < 0 ? '-' : ''}${symbol}${formatValue(displayValue)}`}
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
          <span>{isPositive ? '+' : ''}{displayChange.toFixed(1)}% MTD</span>
        </div>
      </div>
      
      {/* Compact summary row */}
      {!isBlurred && totalLiabilities > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {showGross 
            ? `${symbol}${formatValue(grossAssets)} total assets`
            : `${symbol}${formatValue(grossAssets)} gross − ${symbol}${formatValue(totalLiabilities)} debt`
          }
        </p>
      )}
    </div>
  );
}
