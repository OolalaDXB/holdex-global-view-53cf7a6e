import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase } from 'lucide-react';
import { formatCurrency, convertToEUR, fallbackRates } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Asset } from '@/hooks/useAssets';

interface AssetCardProps {
  asset: Asset;
  rates?: Record<string, number>;
  delay?: number;
}

const typeIcons: Record<string, typeof Building2> = {
  'real-estate': Building2,
  'bank': Landmark,
  'investment': TrendingUp,
  'crypto': Bitcoin,
  'business': Briefcase,
};

const typeLabels: Record<string, string> = {
  'real-estate': 'Real Estate',
  'bank': 'Bank Account',
  'investment': 'Investment',
  'crypto': 'Crypto',
  'business': 'Business Equity',
};

export function AssetCard({ asset, rates, delay = 0 }: AssetCardProps) {
  const Icon = typeIcons[asset.type] || TrendingUp;
  const activeRates = rates || fallbackRates;
  const eurValue = convertToEUR(asset.current_value, asset.currency, activeRates);

  return (
    <div 
      className="asset-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary/10">
            <Icon 
              size={20} 
              strokeWidth={1.5} 
              className="text-primary" 
            />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{asset.name}</h4>
            <p className="text-sm text-muted-foreground">
              {asset.country} · {typeLabels[asset.type] || asset.type}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(asset.current_value, asset.currency)}
          </span>
          {asset.currency !== 'EUR' && (
            <span className="text-sm text-muted-foreground tabular-nums">
              ≈ {formatCurrency(eurValue, 'EUR')}
            </span>
          )}
        </div>

        {asset.type === 'crypto' && asset.quantity && asset.ticker && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.quantity} {asset.ticker}
            </span>
          </div>
        )}

        {asset.rental_income && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Rental: {formatCurrency(asset.rental_income, asset.currency)}/yr
            </span>
          </div>
        )}

        {asset.ownership_percentage && asset.ownership_percentage < 100 && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Your share: {asset.ownership_percentage}%
            </span>
          </div>
        )}

        {asset.institution && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.institution}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
