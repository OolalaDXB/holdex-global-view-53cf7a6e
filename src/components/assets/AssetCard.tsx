import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, TrendingDown } from 'lucide-react';
import { Asset, formatCurrency, convertToEUR } from '@/lib/data';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  delay?: number;
}

const typeIcons = {
  'real-estate': Building2,
  'bank': Landmark,
  'investment': TrendingUp,
  'crypto': Bitcoin,
  'business': Briefcase,
  'liability': TrendingDown,
};

const typeLabels = {
  'real-estate': 'Real Estate',
  'bank': 'Bank Account',
  'investment': 'Investment',
  'crypto': 'Crypto',
  'business': 'Business Equity',
  'liability': 'Liability',
};

export function AssetCard({ asset, delay = 0 }: AssetCardProps) {
  const Icon = typeIcons[asset.type];
  const eurValue = convertToEUR(asset.currentValue, asset.currency);
  const isLiability = asset.type === 'liability';
  const isPositiveChange = asset.change24h && asset.change24h > 0;

  return (
    <div 
      className="asset-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center",
            isLiability ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <Icon 
              size={20} 
              strokeWidth={1.5} 
              className={isLiability ? "text-destructive" : "text-primary"} 
            />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{asset.name}</h4>
            <p className="text-sm text-muted-foreground">
              {asset.country} · {typeLabels[asset.type]}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className={cn(
            "text-xl font-semibold tabular-nums",
            isLiability ? "text-destructive" : "text-foreground"
          )}>
            {formatCurrency(asset.currentValue, asset.currency)}
          </span>
          {asset.currency !== 'EUR' && (
            <span className="text-sm text-muted-foreground tabular-nums">
              ≈ {formatCurrency(eurValue, 'EUR')}
            </span>
          )}
        </div>

        {asset.type === 'crypto' && asset.cryptoQuantity && asset.cryptoToken && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.cryptoQuantity} {asset.cryptoToken}
            </span>
            {asset.change24h !== undefined && (
              <span className={cn(
                "text-sm font-medium",
                isPositiveChange ? "text-positive" : "text-negative"
              )}>
                24h: {isPositiveChange ? '↑' : '↓'} {Math.abs(asset.change24h).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {asset.rentalIncome && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Rental: {formatCurrency(asset.rentalIncome, asset.currency)}/yr
            </span>
          </div>
        )}

        {asset.ownershipPercent && asset.ownershipPercent < 100 && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Your share: {asset.ownershipPercent}%
            </span>
          </div>
        )}

        {asset.platform && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.platform}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
