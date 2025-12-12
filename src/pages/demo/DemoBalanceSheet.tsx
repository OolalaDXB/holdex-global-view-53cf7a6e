import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileDown, ChevronDown, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDemo } from '@/contexts/DemoContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { formatCurrency, convertToEUR } from '@/lib/currency';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type CertaintyFilter = 'all' | 'confirmed' | 'exclude_optional';

const DemoBalanceSheetPage = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('confirmed');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { displayCurrency } = useCurrency();
  const { isBlurred } = useBlur();
  const { assets, collections, liabilities, entities } = useDemo();
  const { data: exchangeRates } = useExchangeRates();
  const rates = exchangeRates?.rates || {};

  // Calculate balance sheet from demo data
  const toBaseCurrency = (value: number, currency: string) => {
    return convertToEUR(value, currency, rates);
  };

  // Filter by entity
  const filterByEntity = <T extends { entity_id?: string | null }>(items: T[]) => {
    if (entityFilter === 'all') return items;
    return items.filter(item => item.entity_id === entityFilter);
  };

  // Filter by certainty - simplified for demo
  const filterAssetsByCertainty = (items: typeof assets) => {
    return items.filter(item => {
      const certainty = (item as any).certainty || 'certain';
      if (certaintyFilter === 'all') return true;
      if (certaintyFilter === 'confirmed') return certainty === 'certain' || certainty === 'contractual';
      if (certaintyFilter === 'exclude_optional') return certainty !== 'optional';
      return true;
    });
  };

  const filterLiabilitiesByCertainty = (items: typeof liabilities) => {
    return items.filter(item => {
      const certainty = (item as any).certainty || 'certain';
      if (certaintyFilter === 'all') return true;
      if (certaintyFilter === 'confirmed') return certainty === 'certain' || certainty === 'contractual';
      if (certaintyFilter === 'exclude_optional') return certainty !== 'optional';
      return true;
    });
  };

  const filteredAssets = filterAssetsByCertainty(filterByEntity(assets));
  const filteredCollections = filterByEntity(collections);
  const filteredLiabilities = filterLiabilitiesByCertainty(filterByEntity(liabilities));

  // Calculate totals
  const cashAndBank = filteredAssets.filter(a => a.type === 'bank-account');
  const digitalAssets = filteredAssets.filter(a => a.type === 'digital-assets');
  const realEstate = filteredAssets.filter(a => a.type === 'real-estate');
  const investments = filteredAssets.filter(a => a.type === 'investments' || a.type === 'business-equity');
  const vehicles = filteredCollections.filter(c => c.type === 'vehicle');
  const otherCollections = filteredCollections.filter(c => c.type !== 'vehicle');

  const creditCards = filteredLiabilities.filter(l => l.type === 'credit_card');
  const mortgages = filteredLiabilities.filter(l => l.type === 'mortgage');
  const otherLoans = filteredLiabilities.filter(l => l.type !== 'credit_card' && l.type !== 'mortgage');

  const sumAssets = (items: typeof assets) => items.reduce((sum, a) => sum + toBaseCurrency(a.current_value, a.currency), 0);
  const sumCollections = (items: typeof collections) => items.reduce((sum, c) => sum + toBaseCurrency(c.current_value, c.currency), 0);
  const sumLiabilities = (items: typeof liabilities) => items.reduce((sum, l) => sum + toBaseCurrency(l.current_balance, l.currency), 0);

  const currentAssetsTotal = sumAssets(cashAndBank) + sumAssets(digitalAssets);
  const nonCurrentAssetsTotal = sumAssets(realEstate) + sumAssets(investments) + sumCollections(vehicles) + sumCollections(otherCollections);
  const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;

  const currentLiabilitiesTotal = sumLiabilities(creditCards);
  const nonCurrentLiabilitiesTotal = sumLiabilities(mortgages) + sumLiabilities(otherLoans);
  const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;

  const netWorth = totalAssets - totalLiabilities;

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
              <div key={i} className="flex justify-between font-mono text-muted-foreground">
                <span>{item.name}</span>
                <span className="tabular-nums">
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
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-3xl">
        <header className="mb-8">
          <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Demo Mode
          </div>
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
                value={sumAssets(cashAndBank)}
                section="cashAndBank"
                items={cashAndBank}
                indent
              />
              <LineItem 
                label="Digital Assets" 
                value={sumAssets(digitalAssets)}
                section="digitalAssets"
                items={digitalAssets}
                indent
              />
              <LineItem 
                label="Total Current Assets" 
                value={currentAssetsTotal}
                isTotal
                bold
              />
            </div>

            {/* Non-Current Assets */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Non-Current Assets</p>
              <LineItem 
                label="Real Estate" 
                value={sumAssets(realEstate)}
                section="realEstate"
                items={realEstate}
                indent
              />
              <LineItem 
                label="Vehicles" 
                value={sumCollections(vehicles)}
                section="vehicles"
                items={vehicles}
                indent
              />
              <LineItem 
                label="Collections" 
                value={sumCollections(otherCollections)}
                section="collections"
                items={otherCollections}
                indent
              />
              <LineItem 
                label="Investments" 
                value={sumAssets(investments)}
                section="investments"
                items={investments}
                indent
              />
              <LineItem 
                label="Total Non-Current Assets" 
                value={nonCurrentAssetsTotal}
                isTotal
                bold
              />
            </div>

            <LineItem 
              label="TOTAL ASSETS" 
              value={totalAssets}
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
                value={sumLiabilities(creditCards)}
                section="creditCards"
                items={creditCards}
                indent
              />
              <LineItem 
                label="Total Current Liabilities" 
                value={currentLiabilitiesTotal}
                isTotal
                bold
              />
            </div>

            {/* Non-Current Liabilities */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Non-Current Liabilities</p>
              <LineItem 
                label="Mortgages" 
                value={sumLiabilities(mortgages)}
                section="mortgages"
                items={mortgages}
                indent
              />
              <LineItem 
                label="Long-term Loans" 
                value={sumLiabilities(otherLoans)}
                section="longTermLoans"
                items={otherLoans}
                indent
              />
              <LineItem 
                label="Total Non-Current Liabilities" 
                value={nonCurrentLiabilitiesTotal}
                isTotal
                bold
              />
            </div>

            <LineItem 
              label="TOTAL LIABILITIES" 
              value={totalLiabilities}
              isGrandTotal
            />
          </div>

          {/* NET WORTH */}
          <div className="pt-6 border-t-2 border-foreground">
            <div className="flex justify-between py-3 font-mono">
              <span className="text-lg font-semibold">NET WORTH (EQUITY)</span>
              <span className={cn(
                "text-lg font-semibold tabular-nums",
                netWorth >= 0 ? "text-sage" : "text-dusty-rose"
              )}>
                {formatValue(netWorth)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DemoBalanceSheetPage;
