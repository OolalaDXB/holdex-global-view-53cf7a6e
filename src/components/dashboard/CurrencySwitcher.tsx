import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  AED: 'AED',
  GBP: '£',
  CHF: 'Fr.',
  RUB: '₽',
};

interface CurrencySwitcherProps {
  isMobileDrawer?: boolean;
}

export function CurrencySwitcher({ isMobileDrawer = false }: CurrencySwitcherProps) {
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    baseCurrency, 
    secondaryCurrency1, 
    secondaryCurrency2 
  } = useCurrency();
  
  const { refetch, isFetching } = useExchangeRates();

  const currencies = [baseCurrency, secondaryCurrency1, secondaryCurrency2].filter(
    (c, i, arr) => arr.indexOf(c) === i // Remove duplicates
  );

  if (isMobileDrawer) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {currencies.map((currency) => (
          <button
            key={currency}
            onClick={() => setDisplayCurrency(currency)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              displayCurrency === currency
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {currencySymbols[currency] || currency} {currency}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "p-2 rounded-lg transition-colors bg-secondary text-muted-foreground hover:text-foreground",
            isFetching && "animate-spin"
          )}
        >
          <RefreshCw size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-secondary/50 rounded-md">
      {currencies.map((currency) => (
        <button
          key={currency}
          onClick={() => setDisplayCurrency(currency)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded transition-colors",
            displayCurrency === currency
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {currencySymbols[currency] || currency}
        </button>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              "p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-background/50",
              isFetching && "animate-spin"
            )}
          >
            <RefreshCw size={12} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh exchange rates</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
