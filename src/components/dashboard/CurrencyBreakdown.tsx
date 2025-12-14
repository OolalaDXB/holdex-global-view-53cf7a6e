import { cn } from '@/lib/utils';

interface CurrencyItem {
  currency: string;
  percentage: number;
}

interface CurrencyBreakdownProps {
  items: CurrencyItem[];
  delay?: number;
  isBlurred?: boolean;
}

// Currency symbols and flags mapping
const currencyInfo: Record<string, { symbol: string; flag: string }> = {
  EUR: { symbol: '€', flag: '🇪🇺' },
  USD: { symbol: '$', flag: '🇺🇸' },
  AED: { symbol: 'د.إ', flag: '🇦🇪' },
  GBP: { symbol: '£', flag: '🇬🇧' },
  CHF: { symbol: 'Fr.', flag: '🇨🇭' },
  RUB: { symbol: '₽', flag: '🇷🇺' },
  JPY: { symbol: '¥', flag: '🇯🇵' },
  CNY: { symbol: '¥', flag: '🇨🇳' },
  INR: { symbol: '₹', flag: '🇮🇳' },
  SAR: { symbol: 'ر.س', flag: '🇸🇦' },
  QAR: { symbol: 'ر.ق', flag: '🇶🇦' },
  KWD: { symbol: 'د.ك', flag: '🇰🇼' },
  BHD: { symbol: 'د.ب', flag: '🇧🇭' },
  OMR: { symbol: 'ر.ع', flag: '🇴🇲' },
  SGD: { symbol: 'S$', flag: '🇸🇬' },
  HKD: { symbol: 'HK$', flag: '🇭🇰' },
  AUD: { symbol: 'A$', flag: '🇦🇺' },
  CAD: { symbol: 'C$', flag: '🇨🇦' },
  NZD: { symbol: 'NZ$', flag: '🇳🇿' },
  ZAR: { symbol: 'R', flag: '🇿🇦' },
  BWP: { symbol: 'P', flag: '🇧🇼' },
  MXN: { symbol: '$', flag: '🇲🇽' },
  BRL: { symbol: 'R$', flag: '🇧🇷' },
  SEK: { symbol: 'kr', flag: '🇸🇪' },
  NOK: { symbol: 'kr', flag: '🇳🇴' },
  DKK: { symbol: 'kr', flag: '🇩🇰' },
  PLN: { symbol: 'zł', flag: '🇵🇱' },
  CZK: { symbol: 'Kč', flag: '🇨🇿' },
  HUF: { symbol: 'Ft', flag: '🇭🇺' },
  TRY: { symbol: '₺', flag: '🇹🇷' },
  ILS: { symbol: '₪', flag: '🇮🇱' },
  EGP: { symbol: '£', flag: '🇪🇬' },
  MAD: { symbol: 'د.م', flag: '🇲🇦' },
  THB: { symbol: '฿', flag: '🇹🇭' },
  MYR: { symbol: 'RM', flag: '🇲🇾' },
  IDR: { symbol: 'Rp', flag: '🇮🇩' },
  PHP: { symbol: '₱', flag: '🇵🇭' },
  VND: { symbol: '₫', flag: '🇻🇳' },
  KRW: { symbol: '₩', flag: '🇰🇷' },
};

const defaultColors = [
  'bg-primary',
  'bg-sage',
  'bg-muted-foreground',
  'bg-dusty-rose',
  'bg-warm-gray',
];

export function CurrencyBreakdown({ items, delay = 0, isBlurred = false }: CurrencyBreakdownProps) {
  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-3">
        {items.map((item, index) => {
          const info = currencyInfo[item.currency];
          const hasSymbol = info?.symbol && info.symbol !== item.currency;
          
          return (
            <div key={item.currency} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-foreground flex items-center gap-2">
                  {info?.flag && <span>{info.flag}</span>}
                  <span>{item.currency}</span>
                  {hasSymbol && (
                    <span className="text-muted-foreground text-xs">({info.symbol})</span>
                  )}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {isBlurred ? '•••' : `${item.percentage.toFixed(0)}%`}
                </span>
              </div>
              <div className="stat-bar">
                <div 
                  className={cn("stat-bar-fill", defaultColors[index % defaultColors.length])}
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
