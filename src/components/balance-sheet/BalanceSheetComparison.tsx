import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonData {
  label: string;
  currentValue: number;
  previousValue: number;
  indent?: number;
  isSubtotal?: boolean;
  isGrandTotal?: boolean;
  isNetWorth?: boolean;
}

interface BalanceSheetComparisonProps {
  currentDate: Date;
  previousDate: Date;
  currentData: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    currentAssets: { total: number; cashAndBank: number; digitalAssets: number; shortTermReceivables: number };
    nonCurrentAssets: { total: number; realEstate: number; vehicles: number; collections: number; investments: number; longTermReceivables: number };
    currentLiabilities: { total: number; creditCards: number; shortTermLoans: number };
    nonCurrentLiabilities: { total: number; mortgages: number; longTermLoans: number };
  };
  previousData: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    currentAssets: { total: number; cashAndBank: number; digitalAssets: number; shortTermReceivables: number };
    nonCurrentAssets: { total: number; realEstate: number; vehicles: number; collections: number; investments: number; longTermReceivables: number };
    currentLiabilities: { total: number; creditCards: number; shortTermLoans: number };
    nonCurrentLiabilities: { total: number; mortgages: number; longTermLoans: number };
  };
  displayCurrency: string;
  isBlurred: boolean;
}

export const BalanceSheetComparison = ({
  currentDate,
  previousDate,
  currentData,
  previousData,
  displayCurrency,
  isBlurred,
}: BalanceSheetComparisonProps) => {
  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return formatCurrency(value, displayCurrency);
  };

  const formatChange = (current: number, previous: number) => {
    const change = current - previous;
    const percentChange = previous !== 0 ? ((change / previous) * 100) : 0;
    
    if (isBlurred) return { value: '•••••', percent: '•••', trend: 'neutral' as const };
    
    return {
      value: formatCurrency(Math.abs(change), displayCurrency),
      percent: `${Math.abs(percentChange).toFixed(1)}%`,
      trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
    };
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-sage" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-dusty-rose" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const ComparisonRow = ({
    label,
    currentValue,
    previousValue,
    indent = 0,
    isSubtotal = false,
    isGrandTotal = false,
    isNetWorth = false,
  }: ComparisonData) => {
    const change = formatChange(currentValue, previousValue);
    const isPositiveChange = change.trend === 'up';
    const isNegativeChange = change.trend === 'down';

    return (
      <tr className={cn(
        isSubtotal && "border-t border-border",
        isGrandTotal && "border-t-2 border-foreground",
        isNetWorth && "border-t-2 border-primary"
      )}>
        <td className={cn(
          "py-1 pr-4 text-sm",
          indent === 1 && "pl-6",
          indent === 2 && "pl-10",
          isSubtotal && "font-medium pt-2",
          isGrandTotal && "font-semibold text-base pt-3 uppercase",
          isNetWorth && "font-semibold text-base pt-4 text-primary",
        )}>
          {label}
        </td>
        <td className={cn(
          "py-1 text-right text-sm tabular-nums whitespace-nowrap",
          isSubtotal && "font-medium pt-2",
          isGrandTotal && "font-semibold text-base pt-3",
          isNetWorth && "font-semibold text-lg pt-4 text-primary",
        )}>
          {formatValue(previousValue)}
        </td>
        <td className={cn(
          "py-1 text-right text-sm tabular-nums whitespace-nowrap",
          isSubtotal && "font-medium pt-2",
          isGrandTotal && "font-semibold text-base pt-3",
          isNetWorth && "font-semibold text-lg pt-4 text-primary",
        )}>
          {formatValue(currentValue)}
        </td>
        <td className={cn(
          "py-1 text-right text-sm tabular-nums whitespace-nowrap pl-4",
          isPositiveChange && !isNetWorth && "text-sage",
          isNegativeChange && !isNetWorth && "text-dusty-rose",
          isNetWorth && isPositiveChange && "text-sage",
          isNetWorth && isNegativeChange && "text-dusty-rose",
        )}>
          <span className="flex items-center justify-end gap-1">
            <TrendIcon trend={change.trend} />
            <span>{change.value}</span>
            <span className="text-muted-foreground text-xs">({change.percent})</span>
          </span>
        </td>
      </tr>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <tr>
      <td colSpan={4} className="pt-6 pb-2">
        <span className="text-[11px] font-medium text-muted-foreground tracking-[0.15em] uppercase">
          {title}
        </span>
      </td>
    </tr>
  );

  const CategoryHeader = ({ title }: { title: string }) => (
    <tr>
      <td colSpan={4} className="pt-3 pb-1">
        <span className="text-xs text-muted-foreground">
          {title}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-border">
        <h2 className="text-lg font-medium tracking-wide uppercase mb-1">
          Comparative Statement of Financial Position
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(previousDate, 'MMM d, yyyy')} vs {format(currentDate, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Comparison Table */}
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left font-normal pb-2 w-[40%]">Description</th>
            <th className="text-right font-normal pb-2 whitespace-nowrap">
              {format(previousDate, 'MMM yyyy')}
            </th>
            <th className="text-right font-normal pb-2 whitespace-nowrap">
              {format(currentDate, 'MMM yyyy')}
            </th>
            <th className="text-right font-normal pb-2 pl-4">Change</th>
          </tr>
        </thead>
        <tbody>
          {/* ASSETS */}
          <SectionHeader title="Assets" />
          
          <CategoryHeader title="Current Assets" />
          <ComparisonRow
            label="Cash & Bank Accounts"
            currentValue={currentData.currentAssets.cashAndBank}
            previousValue={previousData.currentAssets.cashAndBank}
            indent={1}
          />
          <ComparisonRow
            label="Digital Assets"
            currentValue={currentData.currentAssets.digitalAssets}
            previousValue={previousData.currentAssets.digitalAssets}
            indent={1}
          />
          <ComparisonRow
            label="Short-term Receivables"
            currentValue={currentData.currentAssets.shortTermReceivables}
            previousValue={previousData.currentAssets.shortTermReceivables}
            indent={1}
          />
          <ComparisonRow
            label="Total Current Assets"
            currentValue={currentData.currentAssets.total}
            previousValue={previousData.currentAssets.total}
            indent={2}
            isSubtotal
          />

          <CategoryHeader title="Non-Current Assets" />
          <ComparisonRow
            label="Real Estate"
            currentValue={currentData.nonCurrentAssets.realEstate}
            previousValue={previousData.nonCurrentAssets.realEstate}
            indent={1}
          />
          <ComparisonRow
            label="Vehicles"
            currentValue={currentData.nonCurrentAssets.vehicles}
            previousValue={previousData.nonCurrentAssets.vehicles}
            indent={1}
          />
          <ComparisonRow
            label="Collections"
            currentValue={currentData.nonCurrentAssets.collections}
            previousValue={previousData.nonCurrentAssets.collections}
            indent={1}
          />
          <ComparisonRow
            label="Investments"
            currentValue={currentData.nonCurrentAssets.investments}
            previousValue={previousData.nonCurrentAssets.investments}
            indent={1}
          />
          <ComparisonRow
            label="Long-term Receivables"
            currentValue={currentData.nonCurrentAssets.longTermReceivables}
            previousValue={previousData.nonCurrentAssets.longTermReceivables}
            indent={1}
          />
          <ComparisonRow
            label="Total Non-Current Assets"
            currentValue={currentData.nonCurrentAssets.total}
            previousValue={previousData.nonCurrentAssets.total}
            indent={2}
            isSubtotal
          />

          <ComparisonRow
            label="Total Assets"
            currentValue={currentData.totalAssets}
            previousValue={previousData.totalAssets}
            isGrandTotal
          />

          {/* LIABILITIES */}
          <SectionHeader title="Liabilities" />

          <CategoryHeader title="Current Liabilities" />
          <ComparisonRow
            label="Credit Cards"
            currentValue={currentData.currentLiabilities.creditCards}
            previousValue={previousData.currentLiabilities.creditCards}
            indent={1}
          />
          <ComparisonRow
            label="Short-term Loans"
            currentValue={currentData.currentLiabilities.shortTermLoans}
            previousValue={previousData.currentLiabilities.shortTermLoans}
            indent={1}
          />
          <ComparisonRow
            label="Total Current Liabilities"
            currentValue={currentData.currentLiabilities.total}
            previousValue={previousData.currentLiabilities.total}
            indent={2}
            isSubtotal
          />

          <CategoryHeader title="Non-Current Liabilities" />
          <ComparisonRow
            label="Mortgages"
            currentValue={currentData.nonCurrentLiabilities.mortgages}
            previousValue={previousData.nonCurrentLiabilities.mortgages}
            indent={1}
          />
          <ComparisonRow
            label="Long-term Loans"
            currentValue={currentData.nonCurrentLiabilities.longTermLoans}
            previousValue={previousData.nonCurrentLiabilities.longTermLoans}
            indent={1}
          />
          <ComparisonRow
            label="Total Non-Current Liabilities"
            currentValue={currentData.nonCurrentLiabilities.total}
            previousValue={previousData.nonCurrentLiabilities.total}
            indent={2}
            isSubtotal
          />

          <ComparisonRow
            label="Total Liabilities"
            currentValue={currentData.totalLiabilities}
            previousValue={previousData.totalLiabilities}
            isGrandTotal
          />

          {/* NET WORTH */}
          <tr><td colSpan={4} className="h-4" /></tr>
          <ComparisonRow
            label="Net Worth (Equity)"
            currentValue={currentData.netWorth}
            previousValue={previousData.netWorth}
            isNetWorth
          />
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground/60">
          This comparative statement is prepared for informational purposes only.
        </p>
        <p className="text-[9px] text-muted-foreground/40 mt-1">
          Generated on {format(new Date(), 'MMMM d, yyyy')} • Verso
        </p>
      </div>
    </div>
  );
};
