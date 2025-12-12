import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetWorthCardProps {
  totalValue: number;
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

export function NetWorthCard({ totalValue, change, currency = 'EUR', isBlurred = false }: NetWorthCardProps) {
  const isPositive = change >= 0;
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
    </div>
  );
}
