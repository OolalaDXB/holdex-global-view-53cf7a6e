import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { CertaintyBadge } from '@/components/ui/certainty-badge';

interface BalanceSheetItem {
  name: string;
  currency: string;
  current_value?: number;
  current_balance?: number;
  certainty?: string;
}

interface BalanceSheetData {
  currentAssets: {
    cashAndBank: number;
    digitalAssets: number;
    shortTermReceivables: number;
    total: number;
  };
  nonCurrentAssets: {
    realEstate: number;
    vehicles: number;
    collections: number;
    investments: number;
    longTermReceivables: number;
    total: number;
  };
  currentLiabilities: {
    creditCards: number;
    shortTermLoans: number;
    total: number;
  };
  nonCurrentLiabilities: {
    mortgages: number;
    longTermLoans: number;
    total: number;
  };
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  drillDown: {
    cashAndBank: BalanceSheetItem[];
    digitalAssets: BalanceSheetItem[];
    shortTermReceivables: BalanceSheetItem[];
    realEstate: BalanceSheetItem[];
    vehicles: BalanceSheetItem[];
    collections: BalanceSheetItem[];
    investments: BalanceSheetItem[];
    longTermReceivables: BalanceSheetItem[];
    creditCards: BalanceSheetItem[];
    shortTermLoans: BalanceSheetItem[];
    mortgages: BalanceSheetItem[];
    longTermLoans: BalanceSheetItem[];
  };
}

interface BalanceSheetStatementProps {
  data: BalanceSheetData;
  asOfDate: Date;
  displayCurrency: string;
  isBlurred: boolean;
  entityName?: string;
  hideZeroLines?: boolean;
}

export interface BalanceSheetStatementRef {
  exportToPDF: () => Promise<void>;
  print: () => void;
}

export const BalanceSheetStatement = forwardRef<BalanceSheetStatementRef, BalanceSheetStatementProps>(({
  data,
  asOfDate,
  displayCurrency,
  isBlurred,
  entityName = 'Consolidated',
  hideZeroLines = false,
}, ref) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    exportToPDF: async () => {
      if (!contentRef.current || isExporting) return;
      
      setIsExporting(true);
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        
        const element = contentRef.current;
        const opt = {
          margin: [15, 15, 15, 15],
          filename: `balance-sheet-${format(asOfDate, 'yyyy-MM-dd')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          },
        };
        
        await html2pdf().set(opt).from(element).save();
      } catch (error) {
        console.error('PDF export failed:', error);
      } finally {
        setIsExporting(false);
      }
    },
    print: () => {
      window.print();
    },
  }));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    return formatCurrency(value, displayCurrency);
  };

  const LineItem = ({
    label,
    value,
    section,
    items,
    indent = 0,
    isSubtotal = false,
    isGrandTotal = false,
    isNetWorth = false,
  }: {
    label: string;
    value: number;
    section?: string;
    items?: BalanceSheetItem[];
    indent?: number;
    isSubtotal?: boolean;
    isGrandTotal?: boolean;
    isNetWorth?: boolean;
  }) => {
    // Skip zero lines if hideZeroLines is enabled
    if (hideZeroLines && value === 0 && !isSubtotal && !isGrandTotal && !isNetWorth) {
      return null;
    }

    const hasItems = items && items.length > 0;
    const isExpanded = section ? expandedSections.has(section) : false;
    const isZero = value === 0;

    return (
      <>
        <tr
          className={cn(
            "group transition-colors",
            hasItems && "cursor-pointer hover:bg-secondary/30",
            isSubtotal && "border-t border-border",
            isGrandTotal && "border-t-2 border-foreground",
            isNetWorth && "border-t-2 border-primary"
          )}
          onClick={() => section && hasItems && toggleSection(section)}
        >
          <td
            className={cn(
              "py-1 pr-4 text-sm",
              indent === 1 && "pl-6",
              indent === 2 && "pl-10",
              isSubtotal && "font-medium pt-2",
              isGrandTotal && "font-semibold text-base pt-3 uppercase",
              isNetWorth && "font-semibold text-base pt-4 text-primary",
              !isSubtotal && !isGrandTotal && !isNetWorth && "font-normal"
            )}
          >
            <span className="flex items-center gap-1.5">
              {hasItems && (
                isExpanded
                  ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  : <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              {label}
            </span>
          </td>
          <td
            className={cn(
              "py-1 text-right text-sm tabular-nums whitespace-nowrap",
              isZero && !isSubtotal && !isGrandTotal && !isNetWorth && "text-muted-foreground/50",
              isSubtotal && "font-medium pt-2",
              isGrandTotal && "font-semibold text-base pt-3",
              isNetWorth && "font-semibold text-lg pt-4 text-primary",
              value < 0 && "text-dusty-rose"
            )}
          >
            {formatValue(value)}
          </td>
        </tr>

        {isExpanded && items && items.length > 0 && (
          <tr>
            <td colSpan={2} className="p-0">
              <div className="bg-secondary/20 border-y border-border/50 py-1.5 px-6 mb-1">
                <table className="w-full">
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="text-xs text-muted-foreground">
                        <td className="py-0.5 pl-4 flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{item.name}</span>
                          {item.certainty && (
                            <CertaintyBadge certainty={item.certainty} className="text-[9px] py-0 px-1" />
                          )}
                        </td>
                        <td className="py-0.5 text-right tabular-nums">
                          {isBlurred ? '•••••' : formatCurrency(item.current_value || item.current_balance || 0, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <tr>
      <td colSpan={2} className="pt-6 pb-2">
        <span className="text-[11px] font-medium text-muted-foreground tracking-[0.15em] uppercase">
          {title}
        </span>
      </td>
    </tr>
  );

  const CategoryHeader = ({ title }: { title: string }) => (
    <tr>
      <td colSpan={2} className="pt-3 pb-1">
        <span className="text-xs text-muted-foreground">
          {title}
        </span>
      </td>
    </tr>
  );

  const Separator = ({ double = false }: { double?: boolean }) => (
    <tr>
      <td colSpan={2} className="py-1">
        <div className={cn(
          "border-t",
          double ? "border-double border-t-[3px] border-foreground/30" : "border-border/50"
        )} />
      </td>
    </tr>
  );

  return (
    <div 
      ref={contentRef}
      className={cn(
        "max-w-[800px] mx-auto",
        // Print styles - light mode, clean layout
        "print:max-w-none print:mx-0 print:p-8",
        "print:bg-white print:text-black",
        "[&_*]:print:!text-black [&_*]:print:!border-gray-300",
        "[&_.text-muted-foreground]:print:!text-gray-600",
        "[&_.text-primary]:print:!text-[#C4785A]",
        "[&_.bg-secondary]:print:!bg-gray-100",
        "[&_.border-primary]:print:!border-[#C4785A]",
        isExporting && "bg-white text-black [&_*]:!text-black [&_.text-muted-foreground]:!text-gray-600 [&_.text-primary]:!text-[#C4785A]"
      )}
    >
      {/* Statement Header */}
      <div className={cn(
        "text-center mb-6 pb-4 border-b border-border",
        "print:border-gray-300"
      )}>
        <h2 className="text-lg font-medium tracking-wide uppercase mb-1 print:text-black">
          Statement of Financial Position
        </h2>
        <p className="text-sm text-muted-foreground print:text-gray-600">
          As at {format(asOfDate, 'MMMM d, yyyy')}
        </p>
        {entityName !== 'Consolidated' && (
          <p className="text-xs text-muted-foreground mt-1 print:text-gray-500">
            {entityName}
          </p>
        )}
      </div>

      {/* Balance Sheet Table */}
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left font-normal pb-2">Description</th>
            <th className="text-right font-normal pb-2 whitespace-nowrap">
              Amount ({displayCurrency})
            </th>
          </tr>
        </thead>
        <tbody>
          {/* ASSETS SECTION */}
          <SectionHeader title="Assets" />

          <CategoryHeader title="Current Assets" />
          <LineItem
            label="Cash & Bank Accounts"
            value={data.currentAssets.cashAndBank}
            section="cashAndBank"
            items={data.drillDown.cashAndBank}
            indent={1}
          />
          <LineItem
            label="Digital Assets"
            value={data.currentAssets.digitalAssets}
            section="digitalAssets"
            items={data.drillDown.digitalAssets}
            indent={1}
          />
          <LineItem
            label="Receivables (due within 12 months)"
            value={data.currentAssets.shortTermReceivables}
            section="shortTermReceivables"
            items={data.drillDown.shortTermReceivables}
            indent={1}
          />
          <LineItem
            label="Total Current Assets"
            value={data.currentAssets.total}
            isSubtotal
            indent={2}
          />

          <CategoryHeader title="Non-Current Assets" />
          <LineItem
            label="Real Estate"
            value={data.nonCurrentAssets.realEstate}
            section="realEstate"
            items={data.drillDown.realEstate}
            indent={1}
          />
          <LineItem
            label="Vehicles"
            value={data.nonCurrentAssets.vehicles}
            section="vehicles"
            items={data.drillDown.vehicles}
            indent={1}
          />
          <LineItem
            label="Collections & Alternative Assets"
            value={data.nonCurrentAssets.collections}
            section="collections"
            items={data.drillDown.collections}
            indent={1}
          />
          <LineItem
            label="Investments & Securities"
            value={data.nonCurrentAssets.investments}
            section="investments"
            items={data.drillDown.investments}
            indent={1}
          />
          <LineItem
            label="Long-term Receivables"
            value={data.nonCurrentAssets.longTermReceivables}
            section="longTermReceivables"
            items={data.drillDown.longTermReceivables}
            indent={1}
          />
          <LineItem
            label="Total Non-Current Assets"
            value={data.nonCurrentAssets.total}
            isSubtotal
            indent={2}
          />

          <Separator double />
          <LineItem
            label="Total Assets"
            value={data.totalAssets}
            isGrandTotal
          />

          {/* LIABILITIES SECTION */}
          <SectionHeader title="Liabilities" />

          <CategoryHeader title="Current Liabilities" />
          <LineItem
            label="Credit Cards"
            value={data.currentLiabilities.creditCards}
            section="creditCards"
            items={data.drillDown.creditCards}
            indent={1}
          />
          <LineItem
            label="Short-term Borrowings"
            value={data.currentLiabilities.shortTermLoans}
            section="shortTermLoans"
            items={data.drillDown.shortTermLoans}
            indent={1}
          />
          <LineItem
            label="Total Current Liabilities"
            value={data.currentLiabilities.total}
            isSubtotal
            indent={2}
          />

          <CategoryHeader title="Non-Current Liabilities" />
          <LineItem
            label="Mortgages"
            value={data.nonCurrentLiabilities.mortgages}
            section="mortgages"
            items={data.drillDown.mortgages}
            indent={1}
          />
          <LineItem
            label="Long-term Borrowings"
            value={data.nonCurrentLiabilities.longTermLoans}
            section="longTermLoans"
            items={data.drillDown.longTermLoans}
            indent={1}
          />
          <LineItem
            label="Total Non-Current Liabilities"
            value={data.nonCurrentLiabilities.total}
            isSubtotal
            indent={2}
          />

          <Separator double />
          <LineItem
            label="Total Liabilities"
            value={data.totalLiabilities}
            isGrandTotal
          />

          {/* NET WORTH */}
          <tr><td colSpan={2} className="h-4" /></tr>
          <LineItem
            label="Net Worth (Equity)"
            value={data.netWorth}
            isNetWorth
          />
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border text-center print:border-gray-300">
        <p className="text-[10px] text-muted-foreground/60 print:text-gray-500">
          This statement is prepared for informational purposes only and does not constitute financial advice.
        </p>
        <p className="text-[9px] text-muted-foreground/40 mt-1 print:text-gray-400">
          Generated on {format(new Date(), 'MMMM d, yyyy')} • HOLDEX
        </p>
      </div>
    </div>
  );
});

BalanceSheetStatement.displayName = 'BalanceSheetStatement';
