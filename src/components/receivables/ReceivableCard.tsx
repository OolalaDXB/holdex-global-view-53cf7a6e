import { 
  Handshake, 
  Briefcase, 
  Receipt, 
  Home, 
  Wallet, 
  HelpCircle,
  Pencil, 
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { Receivable } from '@/hooks/useReceivables';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CertaintyBadge } from '@/components/ui/certainty-badge';
import { differenceInDays, format } from 'date-fns';

interface ReceivableCardProps {
  receivable: Receivable;
  rates?: Record<string, number>;
  displayCurrency?: string;
  delay?: number;
  onEdit?: (receivable: Receivable) => void;
  onDelete?: (receivable: Receivable) => void;
  onRecordPayment?: (receivable: Receivable) => void;
}

const typeIcons: Record<string, typeof Handshake> = {
  'personal_loan': Handshake,
  'business_loan': Briefcase,
  'expense_reimbursement': Receipt,
  'deposit': Home,
  'advance': Wallet,
  'other': HelpCircle,
};

const typeLabels: Record<string, string> = {
  'personal_loan': 'Personal Loan',
  'business_loan': 'Business Loan',
  'expense_reimbursement': 'Expense',
  'deposit': 'Deposit',
  'advance': 'Advance',
  'other': 'Other',
};

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  'pending': { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  'partial': { label: 'Partial', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: AlertCircle },
  'paid': { label: 'Paid', className: 'bg-positive/10 text-positive border-positive/20', icon: CheckCircle2 },
  'written_off': { label: 'Written Off', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  'disputed': { label: 'Disputed', className: 'bg-negative/10 text-negative border-negative/20', icon: AlertTriangle },
};

export function ReceivableCard({ 
  receivable, 
  rates, 
  displayCurrency = 'EUR', 
  delay = 0, 
  onEdit, 
  onDelete,
  onRecordPayment 
}: ReceivableCardProps) {
  const Icon = typeIcons[receivable.type] || HelpCircle;
  const activeRates = rates || fallbackRates;
  
  // Convert to display currency
  const eurValue = convertToEUR(receivable.current_balance, receivable.currency, activeRates);
  const displayCurrencyValue = convertFromEUR(eurValue, displayCurrency, activeRates);
  
  // Calculate urgency
  const daysUntilDue = receivable.due_date 
    ? differenceInDays(new Date(receivable.due_date), new Date())
    : null;
  
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && receivable.status !== 'paid';
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 30 && receivable.status !== 'paid';
  
  const status = statusConfig[receivable.status] || statusConfig['pending'];
  const StatusIcon = status.icon;

  return (
    <div 
      className={cn(
        "asset-card animate-fade-in group relative",
        isOverdue && "ring-1 ring-negative/30",
        isDueSoon && !isOverdue && "ring-1 ring-yellow-500/30"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Urgency badge */}
      {isOverdue && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -left-2 text-xs"
        >
          <AlertTriangle size={10} className="mr-1" />
          Overdue
        </Badge>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center",
            isOverdue ? "bg-negative/10" : isDueSoon ? "bg-yellow-500/10" : "bg-primary/10"
          )}>
            <Icon 
              size={20} 
              strokeWidth={1.5} 
              className={cn(
                isOverdue ? "text-negative" : isDueSoon ? "text-yellow-600" : "text-primary"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{receivable.name}</h4>
              <CertaintyBadge certainty={receivable.certainty} />
            </div>
            <p className="text-sm text-muted-foreground">
              {receivable.debtor_name} · {typeLabels[receivable.type] || receivable.type}
            </p>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(receivable)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(receivable)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(displayCurrencyValue, displayCurrency)}
          </span>
          {receivable.currency !== displayCurrency && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(receivable.current_balance, receivable.currency)}
            </span>
          )}
        </div>

        {/* Status and due date */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            <StatusIcon size={10} className="mr-1" />
            {status.label}
          </Badge>
          {receivable.due_date && (
            <span className={cn(
              "text-xs",
              isOverdue ? "text-negative" : isDueSoon ? "text-yellow-600" : "text-muted-foreground"
            )}>
              {isOverdue 
                ? `${Math.abs(daysUntilDue!)} days overdue`
                : `Due ${format(new Date(receivable.due_date), 'MMM d, yyyy')}`
              }
            </span>
          )}
        </div>

        {/* Progress if partial */}
        {receivable.status === 'partial' && (
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Received</span>
              <span>{formatCurrency(receivable.original_amount - receivable.current_balance, receivable.currency)} / {formatCurrency(receivable.original_amount, receivable.currency)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((receivable.original_amount - receivable.current_balance) / receivable.original_amount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Record Payment button */}
        {onRecordPayment && receivable.status !== 'paid' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={() => onRecordPayment(receivable)}
          >
            Record Payment
          </Button>
        )}
      </div>
    </div>
  );
}
