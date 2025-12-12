import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { CalendarClock, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useAllUpcomingLoanPayments } from '@/hooks/useLoanSchedules';
import { cn } from '@/lib/utils';

interface UpcomingLoanPaymentsWidgetProps {
  isBlurred?: boolean;
}

export function UpcomingLoanPaymentsWidget({ isBlurred = false }: UpcomingLoanPaymentsWidgetProps) {
  const { data: payments = [], isLoading } = useAllUpcomingLoanPayments();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-secondary rounded w-1/3"></div>
        <div className="h-16 bg-secondary rounded"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return null;
  }

  const today = new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          Upcoming Loan Payments
        </h3>
      </div>
      
      <div className="space-y-2">
        {payments.slice(0, 3).map((payment: any) => {
          const paymentDate = parseISO(payment.payment_date);
          const daysUntil = differenceInDays(paymentDate, today);
          const isOverdue = isPast(paymentDate);
          const isDueSoon = daysUntil <= 7 && daysUntil >= 0;
          
          const liabilityName = payment.loan_schedules?.liabilities?.name || 'Unknown';
          const currency = payment.loan_schedules?.liabilities?.currency || 'EUR';
          
          return (
            <div
              key={payment.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isOverdue && "border-dusty-rose/50 bg-dusty-rose/5",
                isDueSoon && !isOverdue && "border-amber-500/50 bg-amber-500/5",
                !isOverdue && !isDueSoon && "border-border bg-secondary/30"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{liabilityName}</p>
                <p className="text-sm text-muted-foreground">
                  Payment #{payment.payment_number}
                </p>
              </div>
              
              <div className="text-right ml-4">
                <p className="font-semibold tabular-nums">
                  {isBlurred ? '•••••' : formatCurrency(payment.total_amount || 0, currency)}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  {isOverdue ? (
                    <Badge variant="destructive" className="text-xs bg-dusty-rose">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  ) : isDueSoon ? (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      {daysUntil === 0 ? 'Due today' : `${daysUntil}d`}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {format(paymentDate, 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
