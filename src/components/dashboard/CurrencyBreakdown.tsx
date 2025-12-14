interface CurrencyItem {
  currency: string;
  percentage: number;
}

interface CurrencyBreakdownProps {
  items: CurrencyItem[];
  delay?: number;
  isBlurred?: boolean;
}

export function CurrencyBreakdown({ items, delay = 0, isBlurred = false }: CurrencyBreakdownProps) {
  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-wrap gap-4">
        {items.map((item) => (
          <div 
            key={item.currency}
            className="flex items-center gap-2 text-sm"
          >
            <span className="font-medium text-foreground">{item.currency}</span>
            <span className="text-muted-foreground tabular-nums">{isBlurred ? '•••' : `${item.percentage.toFixed(0)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
