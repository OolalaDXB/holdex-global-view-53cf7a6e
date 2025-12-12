import { useState, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { CalendarIcon, FileDown, Info, Printer, Loader2, GitCompare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDemo } from '@/contexts/DemoContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { convertToEUR } from '@/lib/currency';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { BalanceSheetStatement, BalanceSheetStatementRef } from '@/components/balance-sheet/BalanceSheetStatement';
import { BalanceSheetComparison } from '@/components/balance-sheet/BalanceSheetComparison';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type CertaintyFilter = 'all' | 'confirmed' | 'projected';

const DemoBalanceSheetPage = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareDate, setCompareDate] = useState<Date>(subMonths(new Date(), 1));
  const statementRef = useRef<BalanceSheetStatementRef>(null);

  const { displayCurrency } = useCurrency();
  const { isBlurred } = useBlur();
  const { assets, collections, liabilities, entities } = useDemo();
  const { data: exchangeRates } = useExchangeRates();
  const rates = exchangeRates?.rates || {};

  const toBaseCurrency = (value: number, currency: string) => {
    return convertToEUR(value, currency, rates);
  };

  // Filter by entity
  const filterByEntity = <T extends { entity_id?: string | null }>(items: T[]) => {
    if (entityFilter === 'all') return items;
    return items.filter(item => item.entity_id === entityFilter);
  };

  // Filter assets by certainty
  const filterAssetsByCertainty = (items: typeof assets) => {
    return items.filter(item => {
      const certainty = (item as any).certainty || 'certain';
      if (certaintyFilter === 'all') return true;
      if (certaintyFilter === 'confirmed') return certainty === 'certain' || certainty === 'contractual';
      if (certaintyFilter === 'projected') return certainty !== 'certain' && certainty !== 'contractual';
      return true;
    });
  };

  // Filter liabilities by certainty
  const filterLiabilitiesByCertainty = (items: typeof liabilities) => {
    return items.filter(item => {
      const certainty = (item as any).certainty || 'certain';
      if (certaintyFilter === 'all') return true;
      if (certaintyFilter === 'confirmed') return certainty === 'certain' || certainty === 'contractual';
      if (certaintyFilter === 'projected') return certainty !== 'certain' && certainty !== 'contractual';
      return true;
    });
  };

  const filteredAssets = filterAssetsByCertainty(filterByEntity(assets));
  const filteredCollections = filterByEntity(collections);
  const filteredLiabilities = filterLiabilitiesByCertainty(filterByEntity(liabilities));

  // Categorize assets
  const cashAndBank = filteredAssets.filter(a => a.type === 'bank');
  const digitalAssets = filteredAssets.filter(a => a.type === 'crypto');
  const realEstate = filteredAssets.filter(a => a.type === 'real-estate');
  const investments = filteredAssets.filter(a => a.type === 'investment' || a.type === 'business');
  const vehicles = filteredCollections.filter(c => c.type === 'vehicle');
  const otherCollections = filteredCollections.filter(c => c.type !== 'vehicle');

  // Categorize liabilities
  const creditCards = filteredLiabilities.filter(l => l.type === 'credit_card');
  const shortTermLoans = filteredLiabilities.filter(l => l.type === 'personal_loan');
  const mortgages = filteredLiabilities.filter(l => l.type === 'mortgage');
  const longTermLoans = filteredLiabilities.filter(l => l.type !== 'credit_card' && l.type !== 'mortgage' && l.type !== 'personal_loan');

  // Sum helpers
  const sumAssets = (items: typeof assets) => items.reduce((sum, a) => sum + toBaseCurrency(a.current_value, a.currency), 0);
  const sumCollections = (items: typeof collections) => items.reduce((sum, c) => sum + toBaseCurrency(c.current_value, c.currency), 0);
  const sumLiabilities = (items: typeof liabilities) => items.reduce((sum, l) => sum + toBaseCurrency(l.current_balance, l.currency), 0);

  // Calculate totals
  const currentAssetsData = {
    cashAndBank: sumAssets(cashAndBank),
    digitalAssets: sumAssets(digitalAssets),
    shortTermReceivables: 0, // No receivables in demo
    total: sumAssets(cashAndBank) + sumAssets(digitalAssets),
  };

  const nonCurrentAssetsData = {
    realEstate: sumAssets(realEstate),
    vehicles: sumCollections(vehicles),
    collections: sumCollections(otherCollections),
    investments: sumAssets(investments),
    longTermReceivables: 0, // No receivables in demo
    total: sumAssets(realEstate) + sumCollections(vehicles) + sumCollections(otherCollections) + sumAssets(investments),
  };

  const currentLiabilitiesData = {
    creditCards: sumLiabilities(creditCards),
    shortTermLoans: sumLiabilities(shortTermLoans),
    total: sumLiabilities(creditCards) + sumLiabilities(shortTermLoans),
  };

  const nonCurrentLiabilitiesData = {
    mortgages: sumLiabilities(mortgages),
    longTermLoans: sumLiabilities(longTermLoans),
    total: sumLiabilities(mortgages) + sumLiabilities(longTermLoans),
  };

  const totalAssets = currentAssetsData.total + nonCurrentAssetsData.total;
  const totalLiabilities = currentLiabilitiesData.total + nonCurrentLiabilitiesData.total;
  const netWorth = totalAssets - totalLiabilities;

  // Build drill-down data
  const mapToDrillDown = (items: any[]) => items.map(item => ({
    name: item.name,
    currency: item.currency,
    current_value: item.current_value,
    current_balance: item.current_balance,
    certainty: item.certainty,
  }));

  const balanceSheetData = {
    currentAssets: currentAssetsData,
    nonCurrentAssets: nonCurrentAssetsData,
    currentLiabilities: currentLiabilitiesData,
    nonCurrentLiabilities: nonCurrentLiabilitiesData,
    totalAssets,
    totalLiabilities,
    netWorth,
    drillDown: {
      cashAndBank: mapToDrillDown(cashAndBank),
      digitalAssets: mapToDrillDown(digitalAssets),
      shortTermReceivables: [],
      realEstate: mapToDrillDown(realEstate),
      vehicles: mapToDrillDown(vehicles),
      collections: mapToDrillDown(otherCollections),
      investments: mapToDrillDown(investments),
      longTermReceivables: [],
      creditCards: mapToDrillDown(creditCards),
      shortTermLoans: mapToDrillDown(shortTermLoans),
      mortgages: mapToDrillDown(mortgages),
      longTermLoans: mapToDrillDown(longTermLoans),
    },
  };

  // Demo historical data (simulated -10% values for comparison)
  const demoHistoricalData = {
    totalAssets: totalAssets * 0.9,
    totalLiabilities: totalLiabilities * 1.02,
    netWorth: netWorth * 0.88,
    currentAssets: {
      total: currentAssetsData.total * 0.9,
      cashAndBank: currentAssetsData.cashAndBank * 0.85,
      digitalAssets: currentAssetsData.digitalAssets * 0.95,
      shortTermReceivables: 0,
    },
    nonCurrentAssets: {
      total: nonCurrentAssetsData.total * 0.9,
      realEstate: nonCurrentAssetsData.realEstate * 0.92,
      vehicles: nonCurrentAssetsData.vehicles * 0.88,
      collections: nonCurrentAssetsData.collections * 0.9,
      investments: nonCurrentAssetsData.investments * 0.85,
      longTermReceivables: 0,
    },
    currentLiabilities: {
      total: currentLiabilitiesData.total * 1.1,
      creditCards: currentLiabilitiesData.creditCards * 1.15,
      shortTermLoans: currentLiabilitiesData.shortTermLoans * 1.05,
    },
    nonCurrentLiabilities: {
      total: nonCurrentLiabilitiesData.total * 1.01,
      mortgages: nonCurrentLiabilitiesData.mortgages * 1.01,
      longTermLoans: nonCurrentLiabilitiesData.longTermLoans * 1.0,
    },
  };

  const selectedEntity = entities.find(e => e.id === entityFilter);

  const handleExportPDF = async () => {
    if (isBlurred) {
      toast.error('Please disable blur mode before exporting');
      return;
    }
    setIsExporting(true);
    try {
      await statementRef.current?.exportToPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (isBlurred) {
      toast.error('Please disable blur mode before printing');
      return;
    }
    statementRef.current?.print();
  };

  return (
    <AppLayout isDemo>
      <div className="p-6 lg:p-10 print:p-0">
        {/* Demo Banner */}
        <div className="max-w-[800px] mx-auto mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3 print:hidden">
          <Info size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            Demo Mode — Changes are temporary
          </span>
          <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
        </div>

        {/* Controls Header */}
        <div className="max-w-[800px] mx-auto mb-8 print:hidden">
          <div className="flex flex-wrap items-end gap-4 pb-6 border-b border-border">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                As of Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[160px] justify-start bg-secondary border-border">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(asOfDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
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

            {/* Entity Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Entity
              </label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Consolidated</SelectItem>
                  {entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Certainty Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Certainty
              </label>
              <div className="flex rounded-md overflow-hidden border border-border">
                {[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'projected', label: 'Projected' },
                  { value: 'all', label: 'All' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCertaintyFilter(option.value as CertaintyFilter)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      certaintyFilter === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            {/* Compare Mode & Export Buttons */}
            <div className="flex gap-2">
              {/* Compare Mode Toggle */}
              <Button 
                variant={isCompareMode ? "default" : "outline"}
                size="sm" 
                className={cn(
                  isCompareMode ? "" : "bg-secondary border-border"
                )}
                onClick={() => setIsCompareMode(!isCompareMode)}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Compare
              </Button>

              {isCompareMode && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start bg-secondary border-border">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(compareDate, 'MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={compareDate}
                      onSelect={(date) => date && setCompareDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="bg-secondary border-border"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-secondary border-border"
                onClick={handleExportPDF}
                disabled={isExporting || isCompareMode}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Balance Sheet Statement or Comparison */}
        {isCompareMode ? (
          <BalanceSheetComparison
            currentDate={asOfDate}
            previousDate={compareDate}
            currentData={balanceSheetData}
            previousData={demoHistoricalData}
            displayCurrency={displayCurrency}
            isBlurred={isBlurred}
          />
        ) : (
          <BalanceSheetStatement
            ref={statementRef}
            data={balanceSheetData}
            asOfDate={asOfDate}
            displayCurrency={displayCurrency}
            isBlurred={isBlurred}
            entityName={selectedEntity?.name || 'Consolidated'}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default DemoBalanceSheetPage;
