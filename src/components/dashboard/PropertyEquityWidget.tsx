import { Home, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PropertyEquity {
  assetId: string;
  assetName: string;
  assetValue: number;
  liabilityName: string;
  liabilityBalance: number;
  equity: number;
  equityPercentage: number;
  currency: string;
}

interface PropertyEquityWidgetProps {
  properties: PropertyEquity[];
  displayCurrency: string;
  isBlurred?: boolean;
}

export function PropertyEquityWidget({ 
  properties, 
  displayCurrency,
  isBlurred = false 
}: PropertyEquityWidgetProps) {
  if (properties.length === 0) return null;

  const totalAssetValue = properties.reduce((sum, p) => sum + p.assetValue, 0);
  const totalLiabilities = properties.reduce((sum, p) => sum + p.liabilityBalance, 0);
  const totalEquity = properties.reduce((sum, p) => sum + p.equity, 0);
  const overallEquityPercentage = totalAssetValue > 0 ? (totalEquity / totalAssetValue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-medium text-foreground">Property Equity</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm text-muted-foreground tabular-nums">
              {isBlurred ? '••%' : `${overallEquityPercentage.toFixed(0)}% equity`}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total equity across all mortgaged properties</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {properties.map((property) => (
          <div key={property.assetId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Home size={14} className="text-muted-foreground" />
                <span className="text-foreground truncate max-w-[180px]">{property.assetName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "tabular-nums font-medium",
                  property.equity >= 0 ? "text-positive" : "text-negative"
                )}>
                  {isBlurred ? '•••' : formatCurrency(property.equity, displayCurrency)}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {isBlurred ? '••%' : `${property.equityPercentage.toFixed(0)}%`}
                </span>
              </div>
            </div>
            
            {/* Equity bar */}
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                  property.equityPercentage >= 50 ? "bg-positive" : 
                  property.equityPercentage >= 20 ? "bg-primary" : "bg-warning"
                )}
                style={{ width: `${Math.min(property.equityPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Value: {isBlurred ? '•••' : formatCurrency(property.assetValue, displayCurrency)}</span>
              <span>Loan: {isBlurred ? '•••' : formatCurrency(property.liabilityBalance, displayCurrency)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total equity</span>
          <span className={cn(
            "font-semibold tabular-nums",
            totalEquity >= 0 ? "text-positive" : "text-negative"
          )}>
            {isBlurred ? '•••••' : formatCurrency(totalEquity, displayCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
}
