import { useState } from 'react';
import { Plus, Search, Handshake, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceivableCard } from '@/components/receivables/ReceivableCard';
import { ReceivableDialog } from '@/components/receivables/ReceivableDialog';
import { RecordPaymentDialog } from '@/components/receivables/RecordPaymentDialog';
import { DeleteReceivableDialog } from '@/components/receivables/DeleteReceivableDialog';
import { DataStatusBadge } from '@/components/ui/data-status-badge';
import { useReceivables, Receivable } from '@/hooks/useReceivables';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, convertToEUR, convertFromEUR } from '@/lib/currency';
import { differenceInDays } from 'date-fns';

type FilterType = 'all' | 'loans' | 'deposits' | 'expenses' | 'overdue';
type CertaintyFilter = 'all' | 'certain' | 'exclude-optional';

export default function ReceivablesPage() {
  const { data: receivables, isLoading } = useReceivables();
  const { 
    data: exchangeRatesData, 
    isStale: fxIsStale, 
    isUnavailable: fxIsUnavailable, 
    cacheTimestamp: fxCacheTimestamp,
    isFetching: fxFetching,
    refetch: refetchFx
  } = useExchangeRates();
  const { displayCurrency } = useCurrency();
  
  const rates = exchangeRatesData?.rates;
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [deletingReceivable, setDeletingReceivable] = useState<Receivable | null>(null);
  const [paymentReceivable, setPaymentReceivable] = useState<Receivable | null>(null);

  const filteredReceivables = receivables?.filter((r) => {
    // Search filter
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !r.debtor_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filter === 'loans' && !['personal_loan', 'business_loan'].includes(r.type)) return false;
    if (filter === 'deposits' && r.type !== 'deposit') return false;
    if (filter === 'expenses' && r.type !== 'expense_reimbursement') return false;
    if (filter === 'overdue') {
      if (r.status === 'paid') return false;
      const daysUntilDue = r.due_date ? differenceInDays(new Date(r.due_date), new Date()) : null;
      if (daysUntilDue === null || daysUntilDue >= 0) return false;
    }
    
    // Certainty filter
    if (certaintyFilter === 'all') return true;
    const cert = r.certainty || 'certain';
    if (certaintyFilter === 'certain') return cert === 'certain';
    if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
    
    return true;
  }) || [];

  // Calculate totals
  const pendingReceivables = receivables?.filter(r => ['pending', 'partial'].includes(r.status)) || [];
  const overdueReceivables = pendingReceivables.filter(r => {
    if (!r.due_date) return false;
    return differenceInDays(new Date(r.due_date), new Date()) < 0;
  });

  const activeRates = rates || {};

  const totalPending = pendingReceivables.reduce((sum, r) => {
    const eurValue = convertToEUR(r.current_balance, r.currency, activeRates as Record<string, number>);
    return sum + convertFromEUR(eurValue, displayCurrency, activeRates as Record<string, number>);
  }, 0);

  const totalOverdue = overdueReceivables.reduce((sum, r) => {
    const eurValue = convertToEUR(r.current_balance, r.currency, activeRates as Record<string, number>);
    return sum + convertFromEUR(eurValue, displayCurrency, activeRates as Record<string, number>);
  }, 0);

  const handleEdit = (receivable: Receivable) => {
    setEditingReceivable(receivable);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingReceivable(null);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Receivables</h1>
              <p className="text-muted-foreground">Track money owed to you</p>
            </div>
            <Button onClick={handleAdd}>
              <Plus size={16} className="mr-2" />
              Add Receivable
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <DataStatusBadge
              label="FX"
              status={fxIsUnavailable ? 'unavailable' : fxIsStale ? 'stale' : 'live'}
              lastUpdated={exchangeRatesData?.lastUpdated}
              cacheTimestamp={fxCacheTimestamp}
              isFetching={fxFetching}
              onRefresh={refetchFx}
            />
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="asset-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Handshake size={20} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Pending</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalPending, displayCurrency)}</p>
            <p className="text-sm text-muted-foreground">{pendingReceivables.length} receivables</p>
          </div>

          <div className="asset-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-negative/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-negative" />
              </div>
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-negative">{formatCurrency(totalOverdue, displayCurrency)}</p>
            <p className="text-sm text-muted-foreground">{overdueReceivables.length} overdue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receivables..."
              className="pl-9"
            />
          </div>
          
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="overdue" className="text-negative">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Certainty</SelectItem>
              <SelectItem value="certain">Certain Only</SelectItem>
              <SelectItem value="exclude-optional">Exclude Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Receivables Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredReceivables.length === 0 ? (
          <div className="text-center py-12">
            <Handshake size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filter !== 'all' 
                ? 'No receivables match your filters' 
                : 'No receivables yet'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Button onClick={handleAdd}>Add your first receivable</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReceivables.map((receivable, index) => (
              <ReceivableCard
                key={receivable.id}
                receivable={receivable}
                rates={activeRates as Record<string, number>}
                displayCurrency={displayCurrency}
                delay={index * 50}
                onEdit={handleEdit}
                onDelete={setDeletingReceivable}
                onRecordPayment={setPaymentReceivable}
              />
            ))}
          </div>
        )}
      </div>

      <ReceivableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        receivable={editingReceivable}
      />

      <RecordPaymentDialog
        open={!!paymentReceivable}
        onOpenChange={(open) => !open && setPaymentReceivable(null)}
        receivable={paymentReceivable}
      />

      <DeleteReceivableDialog
        open={!!deletingReceivable}
        onOpenChange={(open) => !open && setDeletingReceivable(null)}
        receivable={deletingReceivable}
      />
    </AppLayout>
  );
}
