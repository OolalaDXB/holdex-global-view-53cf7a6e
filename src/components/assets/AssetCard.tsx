import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, Pencil, Trash2, TrendingDown, Flame } from 'lucide-react';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { Asset } from '@/hooks/useAssets';
import { cn } from '@/lib/utils';
import { getCountryFlag } from '@/hooks/useCountries';
import { InstitutionLogo } from '@/components/ui/institution-logo';

interface CryptoPrice {
  price: number;
  change24h: number;
}

interface AssetCardProps {
  asset: Asset;
  rates?: Record<string, number>;
  cryptoPrices?: Record<string, CryptoPrice>;
  displayCurrency?: string;
  delay?: number;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
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

export function AssetCard({ asset, rates, cryptoPrices, displayCurrency = 'EUR', delay = 0, onEdit, onDelete }: AssetCardProps) {
  const Icon = typeIcons[asset.type] || TrendingUp;
  const activeRates = rates || fallbackRates;
  
  // Calculate crypto value from live prices if available
  let displayValue = asset.current_value;
  let change24h: number | undefined;
  
  if (asset.type === 'crypto' && asset.ticker && asset.quantity && cryptoPrices) {
    const cryptoPrice = cryptoPrices[asset.ticker.toUpperCase()];
    if (cryptoPrice) {
      displayValue = cryptoPrice.price * asset.quantity;
      change24h = cryptoPrice.change24h;
    }
  }
  
  // Convert to display currency
  const eurValue = convertToEUR(displayValue, asset.currency, activeRates);
  const displayCurrencyValue = convertFromEUR(eurValue, displayCurrency, activeRates);
  const isPositiveChange = change24h !== undefined && change24h > 0;

  // Get country flag
  const countryFlag = getCountryFlag(asset.country);

  // Determine what to show in the icon area
  const showInstitutionLogo = asset.institution && ['bank', 'investment', 'crypto'].includes(asset.type);
  const showAssetImage = asset.image_url;

  // Check for significant balance change (>5%) for bank accounts
  const hasSignificantChange = asset.type === 'bank' && 
    asset.reference_balance !== null && 
    asset.reference_balance !== undefined && 
    asset.reference_balance !== 0;
  
  const balanceChangePercent = hasSignificantChange 
    ? ((asset.current_value - asset.reference_balance!) / asset.reference_balance!) * 100 
    : 0;
  
  const isSignificantPositive = balanceChangePercent > 5;
  const isSignificantNegative = balanceChangePercent < -5;

  return (
    <div 
      className={cn(
        "asset-card animate-fade-in group relative",
        isSignificantPositive && "ring-1 ring-positive/30",
        isSignificantNegative && "ring-1 ring-negative/30"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Significant change indicator badge */}
      {(isSignificantPositive || isSignificantNegative) && (
        <div className={cn(
          "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
          isSignificantPositive ? "bg-positive text-positive-foreground" : "bg-negative text-negative-foreground"
        )}>
          {isSignificantPositive ? (
            <Flame size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon/Logo/Image area */}
          {showAssetImage ? (
            <img 
              src={asset.image_url!} 
              alt={asset.name}
              className="w-10 h-10 rounded-md object-cover"
            />
          ) : showInstitutionLogo ? (
            <InstitutionLogo institution={asset.institution!} size="md" />
          ) : (
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary/10">
              <Icon 
                size={20} 
                strokeWidth={1.5} 
                className="text-primary" 
              />
            </div>
          )}
          <div>
            <h4 className="font-medium text-foreground">{asset.name}</h4>
            <p className="text-sm text-muted-foreground">
              {countryFlag} {asset.country} · {typeLabels[asset.type] || asset.type}
              {asset.institution && (
                <span className="text-muted-foreground"> · {asset.institution}</span>
              )}
              {asset.type === 'crypto' && asset.platform && (
                <span className="text-muted-foreground"> · {asset.platform}</span>
              )}
            </p>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(asset)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(asset)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(displayCurrencyValue, displayCurrency)}
          </span>
          {asset.currency !== displayCurrency && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(displayValue, asset.currency)}
            </span>
          )}
        </div>

        {asset.type === 'crypto' && asset.quantity && asset.ticker && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.quantity} {asset.ticker}
            </span>
            {change24h !== undefined && (
              <span className={cn(
                "text-sm font-medium",
                isPositiveChange ? "text-positive" : "text-negative"
              )}>
                24h: {isPositiveChange ? '↑' : '↓'} {Math.abs(change24h).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* Bank account reference balance evolution */}
        {asset.type === 'bank' && asset.reference_balance !== null && asset.reference_balance !== undefined && (
          (() => {
            const diff = asset.current_value - asset.reference_balance;
            const percentChange = asset.reference_balance !== 0 
              ? ((diff / asset.reference_balance) * 100) 
              : 0;
            const isPositive = diff >= 0;
            return (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  vs {asset.reference_date ? new Date(asset.reference_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ref'}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-positive" : "text-negative"
                )}>
                  {isPositive ? '↑' : '↓'} {formatCurrency(Math.abs(diff), asset.currency)} ({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)
                </span>
              </div>
            );
          })()
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

      </div>
    </div>
  );
}
