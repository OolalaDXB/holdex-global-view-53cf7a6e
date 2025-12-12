import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, Pencil, Trash2, TrendingDown, Flame, HardHat, Calendar, Moon, Lock } from 'lucide-react';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { Asset } from '@/hooks/useAssets';
import { cn } from '@/lib/utils';
import { getCountryFlag } from '@/hooks/useCountries';
import { InstitutionLogo } from '@/components/ui/institution-logo';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useComplianceMode } from '@/hooks/useComplianceMode';

const LIQUIDITY_STATUS_LABELS: Record<string, string> = {
  restricted: 'Restricted',
  frozen: 'Frozen',
  blocked: 'Blocked',
};

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
  isBlurred?: boolean;
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

const propertyStatusLabels: Record<string, string> = {
  'off_plan': 'Off-Plan',
  'under_construction': 'Under Construction',
  'delivered': 'Delivered',
  'rented_out': 'Rented Out',
  'owned': 'Owned',
};

export function AssetCard({ asset, rates, cryptoPrices, displayCurrency = 'EUR', delay = 0, onEdit, onDelete, isBlurred = false }: AssetCardProps) {
  const Icon = typeIcons[asset.type] || TrendingUp;
  const activeRates = rates || fallbackRates;
  const { showIslamic } = useComplianceMode();
  
  // Check if this is an off-plan property
  const isOffPlan = asset.type === 'real-estate' && ['off_plan', 'under_construction'].includes(asset.property_status || '');
  
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
  
  // For off-plan: display value is amount_paid
  if (isOffPlan && asset.amount_paid) {
    displayValue = asset.amount_paid;
  }
  
  // Calculate payment progress for off-plan
  const paymentProgress = isOffPlan && asset.total_price && asset.amount_paid
    ? (asset.amount_paid / asset.total_price) * 100
    : 0;
  
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

  // Format expected delivery date
  const formatDeliveryDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  };

  return (
    <div 
      className={cn(
        "asset-card animate-fade-in group relative",
        isSignificantPositive && "ring-1 ring-positive/30",
        isSignificantNegative && "ring-1 ring-negative/30",
        isOffPlan && "ring-1 ring-primary/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Off-plan badge */}
      {isOffPlan && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -left-2 bg-primary/10 text-primary border-primary/20 text-xs"
        >
          <HardHat size={10} className="mr-1" />
          {propertyStatusLabels[asset.property_status || 'off_plan']}
        </Badge>
      )}
      
      {/* Shariah Compliant badge - only show when Islamic compliance mode enabled */}
      {showIslamic && asset.is_shariah_compliant && (
        <Badge 
          variant="secondary" 
          className={cn(
            "absolute -top-2 bg-positive/10 text-positive border-positive/20 text-xs",
            isOffPlan ? "left-20" : "-left-2"
          )}
        >
          <Moon size={10} className="mr-1" />
          ☪️ Shariah
        </Badge>
      )}

      {/* Liquidity Status badge - show if not liquid */}
      {(asset as any).liquidity_status && (asset as any).liquidity_status !== 'liquid' && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 bg-warning/10 text-warning border-warning/20 text-xs"
        >
          <Lock size={10} className="mr-1" />
          {LIQUIDITY_STATUS_LABELS[(asset as any).liquidity_status] || (asset as any).liquidity_status}
        </Badge>
      )}
      
      {/* Significant change indicator badge */}
      {(isSignificantPositive || isSignificantNegative) && !isOffPlan && !(asset as any).liquidity_status?.match(/restricted|frozen|blocked/) && (
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
              {!isOffPlan && countryFlag} {!isOffPlan && asset.country} {!isOffPlan && '·'} {typeLabels[asset.type] || asset.type}
              {asset.institution && (
                <span className="text-muted-foreground"> · {asset.institution}</span>
              )}
              {asset.type === 'crypto' && asset.platform && (
                <span className="text-muted-foreground"> · {asset.platform}</span>
              )}
              {isOffPlan && asset.developer && (
                <span className="text-muted-foreground"> · {asset.developer}</span>
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
        {/* Off-plan: Show paid/total with progress */}
        {isOffPlan && asset.total_price ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(asset.amount_paid || 0, asset.currency)} paid
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                / {formatCurrency(asset.total_price, asset.currency)}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={paymentProgress} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{paymentProgress.toFixed(0)}% paid</span>
                {asset.expected_delivery && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    Handover: {formatDeliveryDate(asset.expected_delivery)}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-semibold tabular-nums text-foreground">
              {isBlurred ? '•••••' : formatCurrency(displayCurrencyValue, displayCurrency)}
            </span>
            {asset.currency !== displayCurrency && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {isBlurred ? '•••••' : formatCurrency(displayValue, asset.currency)}
              </span>
            )}
          </div>
        )}

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

        {/* Off-plan project details */}
        {isOffPlan && asset.project_name && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {asset.project_name}{asset.unit_number && ` · ${asset.unit_number}`}
            </span>
          </div>
        )}

        {asset.rental_income && !isOffPlan && (
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
