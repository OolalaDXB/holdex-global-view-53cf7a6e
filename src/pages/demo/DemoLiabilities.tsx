import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDemo } from '@/contexts/DemoContext';
import { demoLoanSchedules, demoLoanPayments, DemoLoanSchedule, DemoLiability } from '@/data/demoData';
import { DemoMonthlyPaymentSummary } from '@/components/liabilities/DemoMonthlyPaymentSummary';
import { LoanComparisonTool } from '@/components/liabilities/LoanComparisonTool';
import { DemoLiabilityDialog } from '@/components/liabilities/DemoLiabilityDialog';
import { DemoDeleteLiabilityDialog } from '@/components/liabilities/DemoDeleteLiabilityDialog';
import { formatCurrency } from '@/lib/currency';
import { getCountryFlag } from '@/hooks/useCountries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Landmark, TrendingDown, Pencil, Trash2, Plus, CreditCard, Car } from 'lucide-react';

function DemoLiabilityCard({ 
  liability,
  onEdit,
  onDelete,
}: { 
  liability: DemoLiability;
  onEdit: (liability: DemoLiability) => void;
  onDelete: (liability: DemoLiability) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Find matching loan schedule
  const schedule = demoLoanSchedules.find(s => s.liability_id === liability.id);
  const payments = schedule ? demoLoanPayments.filter(p => p.loan_schedule_id === schedule.id) : [];
  
  const getIcon = () => {
    switch (liability.type) {
      case 'mortgage': return Landmark;
      case 'car_loan': return Car;
      case 'credit_card': return CreditCard;
      default: return TrendingDown;
    }
  };
  const Icon = getIcon();
  
  // Convert demo schedule to LoanSchedule format for the component
  const scheduleData = schedule ? {
    id: schedule.id,
    liability_id: schedule.liability_id,
    user_id: schedule.user_id,
    loan_type: schedule.loan_type,
    principal_amount: schedule.principal_amount,
    interest_rate: schedule.interest_rate,
    rate_type: schedule.rate_type,
    start_date: schedule.start_date,
    end_date: schedule.end_date,
    term_months: schedule.term_months,
    payment_frequency: schedule.payment_frequency,
    monthly_payment: schedule.monthly_payment,
    total_interest: schedule.total_interest,
    total_cost: schedule.total_cost,
    payments_made: schedule.payments_made,
    next_payment_date: schedule.next_payment_date,
    remaining_principal: schedule.remaining_principal,
    imported_schedule: null,
    is_imported: false,
    notes: null,
    created_at: '',
    updated_at: '',
  } : null;
  
  return (
    <Card className="bg-card border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium">{liability.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span>{getCountryFlag(liability.country)} {liability.institution || liability.type}</span>
                    {liability.is_shariah_compliant && (
                      <Badge variant="outline" className="text-xs">☪️ Shariah</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-lg tabular-nums text-dusty-rose">
                    -{formatCurrency(liability.current_balance, liability.currency)}
                  </p>
                  {liability.original_amount && (
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(liability.original_amount, liability.currency)}
                    </p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Action buttons */}
            <div className="flex gap-2 justify-end border-b border-border pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(liability);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(liability);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-border pt-4">
              {liability.interest_rate && (
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{liability.interest_rate}%</p>
                </div>
              )}
              {liability.monthly_payment && (
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-medium">{formatCurrency(liability.monthly_payment, liability.currency)}</p>
                </div>
              )}
              {liability.start_date && (
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(liability.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {liability.end_date && (
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(liability.end_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            {/* Demo Loan Schedule Display */}
            {scheduleData && (
              <div className="border-t border-border pt-4">
                <DemoLoanScheduleDisplay schedule={scheduleData} payments={payments} currency={liability.currency} />
              </div>
            )}
            
            {!scheduleData && (
              <div className="border-t border-border pt-4 text-center py-6 text-muted-foreground">
                <p>No payment schedule available for this liability in demo mode.</p>
              </div>
            )}
            
            {liability.notes && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">{liability.notes}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Demo-specific loan schedule display (read-only)
function DemoLoanScheduleDisplay({ schedule, payments, currency }: { 
  schedule: any; 
  payments: any[];
  currency: string;
}) {
  const [showTable, setShowTable] = useState(false);
  
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const totalPayments = payments.length;
  const progressPercent = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  
  const nextPayment = payments.find(p => p.status === 'scheduled');
  
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Payment Schedule</h4>
          <Badge variant="outline" className="text-xs">
            {schedule.loan_type === 'amortizing' ? 'Amortizing' : schedule.loan_type}
          </Badge>
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
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
              <p className="font-medium">{formatCurrency(nextPayment.total_amount || 0, currency)}</p>
              <p className="text-xs text-muted-foreground">{nextPayment.payment_date}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle table */}
      <button 
        onClick={() => setShowTable(!showTable)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
      >
        <span>Amortization Table</span>
        {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {showTable && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Payment</th>
                  <th className="px-3 py-2 text-right hidden sm:table-cell">Principal</th>
                  <th className="px-3 py-2 text-right hidden sm:table-cell">Interest</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 50).map((payment: any) => (
                  <tr 
                    key={payment.id}
                    className={`border-t border-border ${payment.status === 'paid' ? 'bg-sage/10' : ''}`}
                  >
                    <td className="px-3 py-2">{payment.payment_number}</td>
                    <td className="px-3 py-2">{payment.payment_date}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(payment.total_amount, currency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                      {formatCurrency(payment.principal_amount, currency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                      {formatCurrency(payment.interest_amount, currency)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={payment.status === 'paid' ? 'outline' : 'secondary'} className="text-xs">
                        {payment.status === 'paid' ? '✓ Paid' : 'Scheduled'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {payments.length > 50 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-2 text-center text-muted-foreground">
                      ... and {payments.length - 50} more payments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const DemoLiabilitiesPage = () => {
  const { liabilities } = useDemo();
  const [editingLiability, setEditingLiability] = useState<DemoLiability | null>(null);
  const [deletingLiability, setDeletingLiability] = useState<DemoLiability | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-5xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Demo Mode
            </div>
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Liabilities</h1>
            <p className="text-muted-foreground">
              Manage your loans, mortgages, and payment schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LoanComparisonTool />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Liability
            </Button>
          </div>
        </header>
        
        {/* Monthly Payment Summary Widget */}
        <DemoMonthlyPaymentSummary />
        
        <div className="space-y-4">
          {liabilities.map((liability) => (
            <DemoLiabilityCard 
              key={liability.id} 
              liability={liability}
              onEdit={setEditingLiability}
              onDelete={setDeletingLiability}
            />
          ))}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <DemoLiabilityDialog
        open={showAddDialog || !!editingLiability}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingLiability(null);
          }
        }}
        liability={editingLiability}
      />

      {/* Delete Confirmation Dialog */}
      {deletingLiability && (
        <DemoDeleteLiabilityDialog
          open={!!deletingLiability}
          onOpenChange={(open) => !open && setDeletingLiability(null)}
          liabilityId={deletingLiability.id}
          liabilityName={deletingLiability.name}
        />
      )}
    </AppLayout>
  );
};

export default DemoLiabilitiesPage;
