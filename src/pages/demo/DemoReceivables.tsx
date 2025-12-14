import { useState } from 'react';
import { Plus, Search, Handshake, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDemo } from '@/contexts/DemoContext';
import { demoReceivables } from '@/data/demoData';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { differenceInDays, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CertaintyBadge } from '@/components/ui/certainty-badge';
import { DemoDataBadge } from '@/components/ui/demo-data-badge';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'loans' | 'deposits' | 'expenses' | 'overdue';
type CertaintyFilter = 'all' | 'certain' | 'exclude-optional';

const typeLabels: Record<string, string> = {
  'personal_loan': 'Personal Loan',
  'business_loan': 'Business Loan',
  'expense_reimbursement': 'Expense',
  'deposit': 'Deposit',
  'advance': 'Advance',
  'other': 'Other',
};

// Use demo receivables from demoData.ts
export default function DemoReceivablesPage() {
  const { displayCurrency } = useCurrency();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');

  const filteredReceivables = demoReceivables.filter((r) => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !r.debtor_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
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
  });

  const pendingReceivables = demoReceivables.filter(r => ['pending', 'partial'].includes(r.status));
  const overdueReceivables = pendingReceivables.filter(r => {
    if (!r.due_date) return false;
    return differenceInDays(new Date(r.due_date), new Date()) < 0;
  });

  const totalPending = pendingReceivables.reduce((sum, r) => sum + r.current_balance, 0);
  const totalOverdue = overdueReceivables.reduce((sum, r) => sum + r.current_balance, 0);

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Receivables</h1>
              <p className="text-muted-foreground">Track money owed to you (Demo)</p>
            </div>
            <Button disabled>
              <Plus size={16} className="mr-2" />
              Add Receivable
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <DemoDataBadge label="FX: Demo rates" />
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
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalPending, 'EUR')}</p>
            <p className="text-sm text-muted-foreground">{pendingReceivables.length} receivables</p>
          </div>

          <div className="asset-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-negative/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-negative" />
              </div>
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-negative">{formatCurrency(totalOverdue, 'EUR')}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReceivables.map((receivable, index) => {
            const daysUntilDue = receivable.due_date 
              ? differenceInDays(new Date(receivable.due_date), new Date())
              : null;
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

            return (
              <div 
                key={receivable.id}
                className={cn(
                  "asset-card animate-fade-in",
                  isOverdue && "ring-1 ring-negative/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {isOverdue && (
                  <Badge variant="destructive" className="absolute -top-2 -left-2 text-xs">
                    <AlertTriangle size={10} className="mr-1" />
                    Overdue
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Handshake size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{receivable.name}</h4>
                      <CertaintyBadge certainty={receivable.certainty} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {receivable.debtor_name} · {typeLabels[receivable.type]}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(receivable.current_balance, receivable.currency)}
                </p>
                {receivable.due_date && (
                  <p className={cn(
                    "text-sm mt-2",
                    isOverdue ? "text-negative" : "text-muted-foreground"
                  )}>
                    {isOverdue 
                      ? `${Math.abs(daysUntilDue!)} days overdue`
                      : `Due ${format(new Date(receivable.due_date), 'MMM d, yyyy')}`
                    }
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
