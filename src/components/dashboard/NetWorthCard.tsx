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
      <div className="flex items-center gap-4 mb-2">
        <p className="wealth-label">{showGross ? 'Gross Assets' : 'Net Worth'}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs transition-colors",
                !showGross ? "text-foreground font-medium" : "text-muted-foreground"
              )}>Net</span>
              <Switch
                checked={showGross}
                onCheckedChange={setShowGross}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary h-4 w-7"
              />
              <span className={cn(
                "text-xs transition-colors",
                showGross ? "text-foreground font-medium" : "text-muted-foreground"
              )}>Gross</span>
            </div>
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
      {!isBlurred && !showGross && totalLiabilities > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {symbol}{formatValue(grossAssets)} gross − {symbol}{formatValue(totalLiabilities)} debt
        </p>
      )}
    </div>
  );
}
