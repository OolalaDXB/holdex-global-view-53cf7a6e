import { useState, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { CalendarIcon, FileDown, Printer, Loader2, GitCompare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useBalanceSheet, CertaintyFilter } from '@/hooks/useBalanceSheet';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useReceivables } from '@/hooks/useReceivables';
import { useEntities } from '@/hooks/useEntities';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useBlur } from '@/contexts/BlurContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BalanceSheetStatement, BalanceSheetStatementRef } from '@/components/balance-sheet/BalanceSheetStatement';
import { BalanceSheetComparison } from '@/components/balance-sheet/BalanceSheetComparison';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SimpleCertaintyFilter = 'all' | 'confirmed' | 'projected';

const BalanceSheetPage = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<SimpleCertaintyFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareDate, setCompareDate] = useState<Date>(subMonths(new Date(), 1));
  const statementRef = useRef<BalanceSheetStatementRef>(null);

  const { displayCurrency } = useCurrency();
  const { isBlurred } = useBlur();

  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: receivables = [] } = useReceivables();
  const { data: entities = [] } = useEntities();
  const { data: netWorthHistory = [] } = useNetWorthHistory();

  // Map simple filter to hook filter
  const hookCertaintyFilter: CertaintyFilter = 
    certaintyFilter === 'confirmed' ? 'confirmed' :
    certaintyFilter === 'projected' ? 'exclude_optional' : 'all';

  const balanceSheet = useBalanceSheet({
    assets,
    collections,
    liabilities,
    receivables,
    entities,
    baseCurrency: displayCurrency,
    entityFilter: entityFilter === 'all' ? null : entityFilter,
    certaintyFilter: hookCertaintyFilter,
  });

  // Find the closest historical snapshot to the compare date
  const getHistoricalData = (targetDate: Date) => {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const snapshot = netWorthHistory.find(h => h.snapshot_date === targetDateStr) ||
      netWorthHistory.reduce((closest, h) => {
        const hDate = new Date(h.snapshot_date);
        const closestDate = closest ? new Date(closest.snapshot_date) : null;
        const targetTime = targetDate.getTime();
        
        if (!closestDate) return h;
        if (Math.abs(hDate.getTime() - targetTime) < Math.abs(closestDate.getTime() - targetTime)) {
          return h;
        }
        return closest;
      }, null as typeof netWorthHistory[0] | null);
    
    if (!snapshot) return null;

    // Parse breakdown_by_type to reconstruct balance sheet categories
    const typeBreakdown = (snapshot.breakdown_by_type as Record<string, number>) || {};
    
    return {
      totalAssets: snapshot.total_assets_eur + snapshot.total_collections_eur,
      totalLiabilities: snapshot.total_liabilities_eur,
      netWorth: snapshot.net_worth_eur,
      currentAssets: {
        total: (typeBreakdown['bank'] || 0) + (typeBreakdown['crypto'] || 0),
        cashAndBank: typeBreakdown['bank'] || 0,
        digitalAssets: typeBreakdown['crypto'] || 0,
        shortTermReceivables: 0,
      },
      nonCurrentAssets: {
        total: (typeBreakdown['real-estate'] || 0) + (typeBreakdown['investment'] || 0) + (typeBreakdown['business'] || 0) + snapshot.total_collections_eur,
        realEstate: typeBreakdown['real-estate'] || 0,
        vehicles: 0,
        collections: snapshot.total_collections_eur,
        investments: (typeBreakdown['investment'] || 0) + (typeBreakdown['business'] || 0),
        longTermReceivables: 0,
      },
      currentLiabilities: {
        total: 0,
        creditCards: 0,
        shortTermLoans: 0,
      },
      nonCurrentLiabilities: {
        total: snapshot.total_liabilities_eur,
        mortgages: snapshot.total_liabilities_eur,
        longTermLoans: 0,
      },
    };
  };

  const historicalData = isCompareMode ? getHistoricalData(compareDate) : null;

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
    <AppLayout>
      <div className="p-6 lg:p-10 print:p-0">
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
                    onClick={() => setCertaintyFilter(option.value as SimpleCertaintyFilter)}
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
        {isCompareMode && historicalData ? (
          <BalanceSheetComparison
            currentDate={asOfDate}
            previousDate={compareDate}
            currentData={balanceSheet}
            previousData={historicalData}
            displayCurrency={displayCurrency}
            isBlurred={isBlurred}
          />
        ) : isCompareMode && !historicalData ? (
          <div className="max-w-[800px] mx-auto text-center py-12">
            <p className="text-muted-foreground">
              No historical snapshots found. Save a snapshot from the dashboard to enable comparison.
            </p>
          </div>
        ) : (
          <BalanceSheetStatement
            ref={statementRef}
            data={balanceSheet}
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

export default BalanceSheetPage;
