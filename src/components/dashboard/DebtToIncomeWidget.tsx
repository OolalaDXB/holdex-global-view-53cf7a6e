import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, convertToEUR, convertFromEUR } from '@/lib/currency';
import { useAssets } from '@/hooks/useAssets';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Info, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebtToIncomeWidgetProps {
  isBlurred?: boolean;
  delay?: number;
}

export function DebtToIncomeWidget({ isBlurred = false, delay = 0 }: DebtToIncomeWidgetProps) {
  const { data: profile } = useProfile();
  const { data: assets = [] } = useAssets();
  const { data: liabilities = [] } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();
  const { displayCurrency } = useCurrency();

  const rates = exchangeRates?.rates || {};
  
  // Get manual monthly income from profile
  const manualIncome = (profile as any)?.monthly_income || 0;
  const incomeCurrency = (profile as any)?.monthly_income_currency || 'EUR';
  const manualIncomeEUR = convertToEUR(manualIncome, incomeCurrency, rates);
  
  // Calculate rental income from real estate assets
  const rentalIncomeEUR = assets
    .filter(a => a.type === 'real-estate' && a.rental_income)
    .reduce((sum, a) => sum + convertToEUR(a.rental_income || 0, a.currency, rates), 0);
  
  // Total monthly income
  const totalMonthlyIncomeEUR = manualIncomeEUR + rentalIncomeEUR;
  
  // Calculate total monthly debt payments
  const monthlyDebtPaymentsEUR = liabilities
    .filter(l => l.monthly_payment)
    .reduce((sum, l) => sum + convertToEUR(l.monthly_payment || 0, l.currency, rates), 0);
  
  // Calculate DTI ratio
  const dtiRatio = totalMonthlyIncomeEUR > 0 
    ? (monthlyDebtPaymentsEUR / totalMonthlyIncomeEUR) * 100 
    : 0;
  
  // Convert for display
  const totalMonthlyIncome = convertFromEUR(totalMonthlyIncomeEUR, displayCurrency, rates);
  const monthlyDebtPayments = convertFromEUR(monthlyDebtPaymentsEUR, displayCurrency, rates);
  
  // DTI health indicators
  const getDtiStatus = (ratio: number) => {
    if (ratio === 0) return { label: 'No data', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Info };
    if (ratio <= 28) return { label: 'Excellent', color: 'text-sage', bgColor: 'bg-sage/20', icon: CheckCircle };
    if (ratio <= 36) return { label: 'Good', color: 'text-primary', bgColor: 'bg-primary/20', icon: CheckCircle };
    if (ratio <= 43) return { label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', icon: AlertTriangle };
    return { label: 'High', color: 'text-dusty-rose', bgColor: 'bg-dusty-rose/20', icon: AlertTriangle };
  };
  
  const status = getDtiStatus(dtiRatio);
  const StatusIcon = status.icon;
  
  // Don't show if no income data
  if (totalMonthlyIncomeEUR === 0 && monthlyDebtPaymentsEUR === 0) {
    return null;
  }
  
  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return formatCurrency(value, displayCurrency);
  };

  return (
    <Card 
      className="bg-card border-border mb-6 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            Debt-to-Income Ratio
          </CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                DTI compares monthly debt payments to monthly income. Under 36% is considered healthy for most lenders.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DTI Ratio Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full", status.bgColor)}>
              <StatusIcon className={cn("h-4 w-4", status.color)} />
            </div>
            <span className={cn("text-sm font-medium", status.color)}>{status.label}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-semibold tabular-nums">
              {isBlurred ? '••' : dtiRatio.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress 
            value={Math.min(dtiRatio, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-sage">28%</span>
            <span className="text-yellow-500">43%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <p className="text-sm font-medium tabular-nums text-sage">
              {formatValue(totalMonthlyIncome)}
            </p>
            {rentalIncomeEUR > 0 && manualIncomeEUR > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                (incl. rental income)
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Debt</p>
            <p className="text-sm font-medium tabular-nums text-dusty-rose">
              {formatValue(monthlyDebtPayments)}
            </p>
          </div>
        </div>
        
        {/* No income warning */}
        {totalMonthlyIncomeEUR === 0 && monthlyDebtPaymentsEUR > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Add monthly income in Settings for accurate DTI calculation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
