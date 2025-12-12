import { useState } from 'react';
import { format, isPast, isSameMonth, parseISO } from 'date-fns';
import { CalendarDays, Check, ChevronDown, ChevronUp, Clock, AlertCircle, Plus, Upload, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { LoanSchedule, LoanPayment, useLoanPayments, useMarkPaymentPaid } from '@/hooks/useLoanSchedules';
import { LoanScheduleDialog } from './LoanScheduleDialog';
import { ImportScheduleDialog } from './ImportScheduleDialog';
import { DeleteScheduleDialog } from './DeleteScheduleDialog';
import { MarkPaymentDialog } from './MarkPaymentDialog';
import { useToast } from '@/hooks/use-toast';

interface LoanScheduleSectionProps {
  liabilityId: string;
  liabilityName: string;
  currency: string;
  schedule: LoanSchedule | null;
  originalAmount?: number;
  interestRate?: number;
  startDate?: string;
}

export function LoanScheduleSection({
  liabilityId,
  liabilityName,
  currency,
  schedule,
  originalAmount,
  interestRate,
  startDate,
}: LoanScheduleSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [markingPayment, setMarkingPayment] = useState<LoanPayment | null>(null);
  
  const { data: payments = [] } = useLoanPayments(schedule?.id);

  if (!schedule) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 text-center">
        <CalendarDays className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h4 className="font-medium text-foreground mb-1">No Payment Schedule</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add a payment schedule to track amortization
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import from CSV
          </Button>
        </div>
        
        <LoanScheduleDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          liabilityId={liabilityId}
          liabilityName={liabilityName}
          defaultPrincipal={originalAmount}
          defaultRate={interestRate}
          defaultStartDate={startDate}
        />
        
        <ImportScheduleDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          liabilityId={liabilityId}
          liabilityName={liabilityName}
          currency={currency}
        />
      </div>
    );
  }

  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const totalPayments = payments.length;
  const progressPercent = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  
  const today = new Date();
  const nextPayment = payments.find(p => p.status === 'scheduled');

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Payment Schedule</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {schedule.loan_type === 'amortizing' ? 'Amortizing' : 
               schedule.loan_type === 'bullet' ? 'Bullet' :
               schedule.loan_type === 'balloon' ? 'Balloon' : 'Interest Only'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Schedule
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Principal</p>
            <p className="font-medium">{formatCurrency(schedule.principal_amount, currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rate</p>
            <p className="font-medium">{schedule.interest_rate}% {schedule.rate_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Term</p>
            <p className="font-medium">{schedule.term_months} months</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="font-medium">{formatCurrency(schedule.monthly_payment || 0, currency)}</p>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{paidPayments} / {totalPayments} payments</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        
        {/* Remaining & Next Payment */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Remaining Principal</p>
            <p className="font-semibold text-lg">{formatCurrency(schedule.remaining_principal || 0, currency)}</p>
          </div>
          {nextPayment && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next Payment</p>
              <p className="font-medium">
                {formatCurrency(nextPayment.total_amount || 0, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(nextPayment.payment_date), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Amortization Table */}
      <Collapsible open={showTable} onOpenChange={setShowTable}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span>Amortization Table</span>
            {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border border-border rounded-lg overflow-hidden mt-2">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Payment</th>
                    <th className="px-3 py-2 text-right hidden sm:table-cell">Principal</th>
                    <th className="px-3 py-2 text-right hidden sm:table-cell">Interest</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const paymentDate = parseISO(payment.payment_date);
                    const isPastDue = isPast(paymentDate) && payment.status === 'scheduled';
                    const isCurrentMonth = isSameMonth(paymentDate, today);
                    
                    return (
                      <tr 
                        key={payment.id}
                        className={cn(
                          "border-t border-border",
                          payment.status === 'paid' && "bg-sage/10",
                          payment.status === 'missed' && "bg-dusty-rose/10",
                          isPastDue && "bg-amber-500/10",
                          isCurrentMonth && payment.status === 'scheduled' && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-2">{payment.payment_number}</td>
                        <td className="px-3 py-2">{format(paymentDate, 'MMM yyyy')}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(payment.total_amount || 0, currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                          {formatCurrency(payment.principal_amount || 0, currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                          {formatCurrency(payment.interest_amount || 0, currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(payment.remaining_principal || 0, currency)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {payment.status === 'paid' ? (
                            <Badge variant="outline" className="bg-sage/20 text-sage border-sage/30">
                              <Check className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : payment.status === 'missed' ? (
                            <Badge variant="destructive" className="bg-dusty-rose text-white">
                              Missed
                            </Badge>
                          ) : isPastDue ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-xs border-amber-500 text-amber-600 hover:bg-amber-50"
                              onClick={() => setMarkingPayment(payment)}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setMarkingPayment(payment)}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {markingPayment && (
        <MarkPaymentDialog
          open={!!markingPayment}
          onOpenChange={(open) => !open && setMarkingPayment(null)}
          payment={markingPayment}
          scheduleId={schedule.id}
          currency={currency}
        />
      )}
      
      {/* Edit Dialog */}
      <LoanScheduleDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        liabilityId={liabilityId}
        liabilityName={liabilityName}
        defaultPrincipal={schedule.principal_amount}
        defaultRate={schedule.interest_rate || 0}
        defaultStartDate={schedule.start_date}
        existingSchedule={schedule}
      />
      
      {/* Delete Dialog */}
      <DeleteScheduleDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        scheduleId={schedule.id}
        liabilityName={liabilityName}
      />
    </div>
  );
}
