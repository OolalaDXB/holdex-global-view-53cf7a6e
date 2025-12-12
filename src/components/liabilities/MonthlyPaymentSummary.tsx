import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { CalendarClock, TrendingDown, Wallet } from 'lucide-react';

export function MonthlyPaymentSummary() {
  const { data: liabilities = [] } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();
  const { displayCurrency } = useCurrency();
  const { isBlurred } = useBlur();
  
  const rates = exchangeRates?.rates || fallbackRates;
  
  // Calculate total monthly payments across all liabilities
  const liabilitiesWithPayments = liabilities.filter(l => l.monthly_payment && l.monthly_payment > 0);
  
  const totalMonthlyEUR = liabilitiesWithPayments.reduce((sum, l) => {
    const eurValue = convertToEUR(l.monthly_payment || 0, l.currency, rates);
    return sum + eurValue;
  }, 0);
  
  const totalMonthly = convertFromEUR(totalMonthlyEUR, displayCurrency, rates);
  
  // Calculate total outstanding
  const totalOutstandingEUR = liabilities.reduce((sum, l) => {
    return sum + convertToEUR(l.current_balance, l.currency, rates);
  }, 0);
  
  const totalOutstanding = convertFromEUR(totalOutstandingEUR, displayCurrency, rates);
  
  // Calculate total original amount
  const totalOriginalEUR = liabilities.reduce((sum, l) => {
    return sum + convertToEUR(l.original_amount || l.current_balance, l.currency, rates);
  }, 0);
  
  // Calculate overall payoff percentage
  const paidOffPercent = totalOriginalEUR > 0 
    ? ((totalOriginalEUR - totalOutstandingEUR) / totalOriginalEUR) * 100 
    : 0;
  
  if (liabilities.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Outstanding */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-dusty-rose" />
          <span className="text-sm text-muted-foreground">Total Outstanding</span>
        </div>
        <p className="text-2xl font-semibold text-dusty-rose tabular-nums">
          {isBlurred ? '•••••' : `-${formatCurrency(totalOutstanding, displayCurrency)}`}
        </p>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Paid off</span>
            <span>{paidOffPercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-sage transition-all duration-300"
              style={{ width: `${Math.min(paidOffPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Monthly Payments */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Monthly Payments</span>
        </div>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {isBlurred ? '•••••' : formatCurrency(totalMonthly, displayCurrency)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Across {liabilitiesWithPayments.length} active {liabilitiesWithPayments.length === 1 ? 'loan' : 'loans'}
        </p>
      </div>
      
      {/* Yearly Cost */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Annual Payments</span>
        </div>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {isBlurred ? '•••••' : formatCurrency(totalMonthly * 12, displayCurrency)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Total yearly loan cost
        </p>
      </div>
    </div>
  );
}
