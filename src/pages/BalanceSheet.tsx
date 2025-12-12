import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileDown, ChevronDown, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useBalanceSheet, CertaintyFilter } from '@/hooks/useBalanceSheet';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useReceivables } from '@/hooks/useReceivables';
import { useEntities } from '@/hooks/useEntities';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CertaintyBadge } from '@/components/ui/certainty-badge';
import { cn } from '@/lib/utils';

const BalanceSheetPage = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('confirmed');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { displayCurrency } = useCurrency();
  const { isBlurred } = useBlur();
  
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: receivables = [] } = useReceivables();
  const { data: entities = [] } = useEntities();

  const balanceSheet = useBalanceSheet({
    assets,
    collections,
    liabilities,
    receivables,
    entities,
    baseCurrency: displayCurrency,
    entityFilter: entityFilter === 'all' ? null : entityFilter,
    certaintyFilter,
  });

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
    indent = false,
    bold = false,
    isTotal = false,
    isGrandTotal = false,
  }: { 
    label: string; 
    value: number; 
    section?: string;
    items?: any[];
    indent?: boolean;
    bold?: boolean;
    isTotal?: boolean;
    isGrandTotal?: boolean;
  }) => {
    const hasItems = items && items.length > 0;
    const isExpanded = section ? expandedSections.has(section) : false;

    return (
      <>
        <div 
          className={cn(
            "flex justify-between py-1.5 font-mono text-sm",
            indent && "pl-6",
            bold && "font-medium",
            isTotal && "border-t border-border pt-2 mt-1",
            isGrandTotal && "border-t-2 border-foreground pt-3 mt-2 text-base font-semibold",
            hasItems && "cursor-pointer hover:bg-secondary/30 -mx-4 px-4 rounded",
          )}
          onClick={() => section && hasItems && toggleSection(section)}
        >
          <span className="flex items-center gap-2">
            {hasItems && (
              isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
            )}
            {label}
          </span>
          <span className={cn("tabular-nums", value < 0 && "text-dusty-rose")}>
            {formatValue(value)}
          </span>
        </div>
        
        {isExpanded && items && (
          <div className="pl-10 py-2 space-y-1 bg-secondary/20 -mx-4 px-4 mb-2 text-xs">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between font-mono text-muted-foreground gap-2">
                <span className="flex items-center gap-2 truncate">
                  {item.name}
                  <CertaintyBadge certainty={item.certainty} className="text-[10px] py-0 px-1" />
                </span>
                <span className="tabular-nums flex-shrink-0">
                  {isBlurred ? '•••••' : formatCurrency(item.current_value || item.current_balance, item.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-3xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Balance Sheet</h1>
          <p className="text-muted-foreground">
            Financial position statement
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-border">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">As of</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[140px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(asOfDate, 'PP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={(date) => date && setAsOfDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Entity</p>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Consolidated)</SelectItem>
                {entities.map(entity => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Certainty</p>
            <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed only</SelectItem>
                <SelectItem value="exclude_optional">Exclude optional</SelectItem>
                <SelectItem value="all">Include all</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground opacity-0">Export</p>
            <Button variant="outline" size="sm" disabled>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b border-border pb-4">
            <h2 className="font-serif text-xl font-medium">BALANCE SHEET</h2>
            <p className="text-sm text-muted-foreground mt-1">
              As of {format(asOfDate, 'MMMM d, yyyy')}
            </p>
          </div>

          {/* ASSETS */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-4">Assets</h3>
            
            {/* Current Assets */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Current Assets</p>
              <LineItem 
                label="Cash & Bank Accounts" 
                value={balanceSheet.currentAssets.cashAndBank}
                section="cashAndBank"
                items={balanceSheet.drillDown.cashAndBank}
                indent
              />
              <LineItem 
                label="Digital Assets" 
                value={balanceSheet.currentAssets.digitalAssets}
                section="digitalAssets"
                items={balanceSheet.drillDown.digitalAssets}
                indent
              />
              <LineItem 
                label="Receivables (< 1 year)" 
                value={balanceSheet.currentAssets.shortTermReceivables}
                section="shortTermReceivables"
                items={balanceSheet.drillDown.shortTermReceivables}
                indent
              />
              <LineItem 
                label="Total Current Assets" 
                value={balanceSheet.currentAssets.total}
                isTotal
                bold
              />
            </div>

            {/* Non-Current Assets */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Non-Current Assets</p>
              <LineItem 
                label="Real Estate" 
                value={balanceSheet.nonCurrentAssets.realEstate}
                section="realEstate"
                items={balanceSheet.drillDown.realEstate}
                indent
              />
              <LineItem 
                label="Vehicles" 
                value={balanceSheet.nonCurrentAssets.vehicles}
                section="vehicles"
                items={balanceSheet.drillDown.vehicles}
                indent
              />
              <LineItem 
                label="Collections" 
                value={balanceSheet.nonCurrentAssets.collections}
                section="collections"
                items={balanceSheet.drillDown.collections}
                indent
              />
              <LineItem 
                label="Investments" 
                value={balanceSheet.nonCurrentAssets.investments}
                section="investments"
                items={balanceSheet.drillDown.investments}
                indent
              />
              <LineItem 
                label="Receivables (> 1 year)" 
                value={balanceSheet.nonCurrentAssets.longTermReceivables}
                section="longTermReceivables"
                items={balanceSheet.drillDown.longTermReceivables}
                indent
              />
              <LineItem 
                label="Total Non-Current Assets" 
                value={balanceSheet.nonCurrentAssets.total}
                isTotal
                bold
              />
            </div>

            <LineItem 
              label="TOTAL ASSETS" 
              value={balanceSheet.totalAssets}
              isGrandTotal
            />
          </div>

          {/* LIABILITIES */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-4">Liabilities</h3>
            
            {/* Current Liabilities */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Current Liabilities</p>
              <LineItem 
                label="Credit Cards" 
                value={balanceSheet.currentLiabilities.creditCards}
                section="creditCards"
                items={balanceSheet.drillDown.creditCards}
                indent
              />
              <LineItem 
                label="Short-term Loans" 
                value={balanceSheet.currentLiabilities.shortTermLoans}
                section="shortTermLoans"
                items={balanceSheet.drillDown.shortTermLoans}
                indent
              />
              <LineItem 
                label="Total Current Liabilities" 
                value={balanceSheet.currentLiabilities.total}
                isTotal
                bold
              />
            </div>

            {/* Non-Current Liabilities */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Non-Current Liabilities</p>
              <LineItem 
                label="Mortgages" 
                value={balanceSheet.nonCurrentLiabilities.mortgages}
                section="mortgages"
                items={balanceSheet.drillDown.mortgages}
                indent
              />
              <LineItem 
                label="Long-term Loans" 
                value={balanceSheet.nonCurrentLiabilities.longTermLoans}
                section="longTermLoans"
                items={balanceSheet.drillDown.longTermLoans}
                indent
              />
              <LineItem 
                label="Total Non-Current Liabilities" 
                value={balanceSheet.nonCurrentLiabilities.total}
                isTotal
                bold
              />
            </div>

            <LineItem 
              label="TOTAL LIABILITIES" 
              value={balanceSheet.totalLiabilities}
              isGrandTotal
            />
          </div>

          {/* NET WORTH */}
          <div className="pt-6 border-t-2 border-foreground">
            <div className="flex justify-between py-3 font-mono">
              <span className="text-lg font-semibold">NET WORTH (EQUITY)</span>
              <span className={cn(
                "text-lg font-semibold tabular-nums",
                balanceSheet.netWorth >= 0 ? "text-sage" : "text-dusty-rose"
              )}>
                {formatValue(balanceSheet.netWorth)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BalanceSheetPage;
