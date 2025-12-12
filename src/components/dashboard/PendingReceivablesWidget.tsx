import { Link } from 'react-router-dom';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useReceivables } from '@/hooks/useReceivables';
import { formatCurrency, convertToEUR, fallbackRates } from '@/lib/currency';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PendingReceivablesWidgetProps {
  isBlurred?: boolean;
}

export function PendingReceivablesWidget({ isBlurred = false }: PendingReceivablesWidgetProps) {
  const { data: receivables = [] } = useReceivables();
  const { data: exchangeRates } = useExchangeRates();
  const { displayCurrency } = useCurrency();
  const rates = exchangeRates?.rates || fallbackRates;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter pending receivables
  const pendingReceivables = receivables.filter(r => 
    r.status === 'pending' || r.status === 'partial'
  );

  // Overdue receivables (past due date)
  const overdueReceivables = pendingReceivables.filter(r => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    return dueDate < today;
  });

  // Due soon (within 30 days)
  const dueSoonReceivables = pendingReceivables.filter(r => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 30;
  });

  // Calculate totals in display currency
  const totalOverdueEUR = overdueReceivables.reduce((sum, r) => 
    sum + convertToEUR(r.current_balance, r.currency, rates), 0
  );
  
  const totalPendingEUR = pendingReceivables.reduce((sum, r) => 
    sum + convertToEUR(r.current_balance, r.currency, rates), 0
  );

  if (pendingReceivables.length === 0) return null;

  return (
    <section className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-medium text-foreground">Pending Receivables</h3>
        <Link 
          to="/receivables" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overdue Card */}
        {overdueReceivables.length > 0 && (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-destructive" />
              <span className="text-sm font-medium text-destructive">Overdue</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {isBlurred ? '•••••' : formatCurrency(totalOverdueEUR, 'EUR')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {overdueReceivables.length} receivable{overdueReceivables.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Due Soon Card */}
        {dueSoonReceivables.length > 0 && (
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-warning" />
              <span className="text-sm font-medium text-warning">Due within 30 days</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {dueSoonReceivables.length} receivable{dueSoonReceivables.length !== 1 ? 's' : ''} coming due
            </p>
          </div>
        )}

        {/* Total Pending Card */}
        <div className="p-4 rounded-lg border border-border bg-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Pending</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {isBlurred ? '•••••' : formatCurrency(totalPendingEUR, 'EUR')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingReceivables.length} receivable{pendingReceivables.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Top 3 overdue items */}
      {overdueReceivables.length > 0 && (
        <div className="mt-4 space-y-2">
          {overdueReceivables.slice(0, 3).map(receivable => {
            const daysOverdue = Math.ceil((today.getTime() - new Date(receivable.due_date!).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div 
                key={receivable.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{receivable.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {receivable.debtor_name} · {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums text-destructive">
                  {isBlurred ? '•••••' : formatCurrency(receivable.current_balance, receivable.currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
