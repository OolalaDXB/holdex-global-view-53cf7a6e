import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { CalendarIcon, Calculator, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  useCreateLoanSchedule, 
  useCreateLoanPayments,
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  LoanSchedule
} from '@/hooks/useLoanSchedules';

interface LoanScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liabilityId: string;
  liabilityName: string;
  defaultPrincipal?: number;
  defaultRate?: number;
  defaultStartDate?: string;
  existingSchedule?: LoanSchedule | null;
}

const LOAN_TYPES = [
  { value: 'amortizing', label: 'Amortizing (Standard)' },
  { value: 'bullet', label: 'Bullet (Principal at End)' },
  { value: 'balloon', label: 'Balloon' },
  { value: 'interest_only', label: 'Interest Only' },
];

const RATE_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'variable', label: 'Variable' },
  { value: 'capped', label: 'Capped' },
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
];

export function LoanScheduleDialog({
  open,
  onOpenChange,
  liabilityId,
  liabilityName,
  defaultPrincipal = 0,
  defaultRate = 0,
  defaultStartDate,
  existingSchedule,
}: LoanScheduleDialogProps) {
  const { toast } = useToast();
  const createSchedule = useCreateLoanSchedule();
  const createPayments = useCreateLoanPayments();
  
  const [formData, setFormData] = useState({
    loan_type: 'amortizing' as 'amortizing' | 'bullet' | 'balloon' | 'interest_only',
    principal_amount: defaultPrincipal.toString(),
    interest_rate: defaultRate.toString(),
    rate_type: 'fixed' as 'fixed' | 'variable' | 'capped',
    term_months: '180',
    start_date: defaultStartDate ? new Date(defaultStartDate) : new Date(),
    payment_frequency: 'monthly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
  });
  
  const [calculatedPayment, setCalculatedPayment] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingSchedule) {
      setFormData({
        loan_type: (existingSchedule.loan_type || 'amortizing') as 'amortizing' | 'bullet' | 'balloon' | 'interest_only',
        principal_amount: existingSchedule.principal_amount.toString(),
        interest_rate: existingSchedule.interest_rate?.toString() || '0',
        rate_type: (existingSchedule.rate_type || 'fixed') as 'fixed' | 'variable' | 'capped',
        term_months: existingSchedule.term_months?.toString() || '180',
        start_date: new Date(existingSchedule.start_date),
        payment_frequency: (existingSchedule.payment_frequency || 'monthly') as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
      });
      setCalculatedPayment(existingSchedule.monthly_payment);
    }
  }, [existingSchedule]);

  const handleCalculate = () => {
    const principal = parseFloat(formData.principal_amount) || 0;
    const rate = parseFloat(formData.interest_rate) || 0;
    const term = parseInt(formData.term_months) || 180;
    
    if (principal > 0 && term > 0) {
      const payment = calculateMonthlyPayment(principal, rate, term);
      setCalculatedPayment(payment);
    }
  };

  const handleSubmit = async () => {
    const principal = parseFloat(formData.principal_amount) || 0;
    const rate = parseFloat(formData.interest_rate) || 0;
    const term = parseInt(formData.term_months) || 180;
    
    if (principal <= 0) {
      toast({ variant: 'destructive', title: 'Invalid principal amount' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const monthlyPayment = calculatedPayment || calculateMonthlyPayment(principal, rate, term);
      const schedule = generateAmortizationSchedule(
        principal, 
        rate, 
        term, 
        formData.start_date,
        formData.payment_frequency
      );
      
      const totalInterest = schedule.reduce((sum, p) => sum + p.interest_amount, 0);
      const endDate = addMonths(formData.start_date, term);
      
      // Create the loan schedule
      const createdSchedule = await createSchedule.mutateAsync({
        liability_id: liabilityId,
        loan_type: formData.loan_type,
        principal_amount: principal,
        interest_rate: rate,
        rate_type: formData.rate_type,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        term_months: term,
        payment_frequency: formData.payment_frequency,
        monthly_payment: monthlyPayment,
        total_interest: totalInterest,
        total_cost: principal + totalInterest,
        payments_made: 0,
        next_payment_date: schedule[0]?.payment_date || null,
        remaining_principal: principal,
        imported_schedule: null,
        is_imported: false,
        notes: null,
      });
      
      // Create all payment entries
      const payments = schedule.map(entry => ({
        loan_schedule_id: createdSchedule.id,
        payment_number: entry.payment_number,
        payment_date: entry.payment_date,
        principal_amount: entry.principal_amount,
        interest_amount: entry.interest_amount,
        total_amount: entry.total_amount,
        remaining_principal: entry.remaining_principal,
        status: 'scheduled' as const,
        actual_payment_date: null,
        actual_amount: null,
        notes: null,
      }));
      
      await createPayments.mutateAsync(payments);
      
      toast({
        title: 'Payment schedule created',
        description: `Created ${schedule.length} payment entries for ${liabilityName}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create payment schedule',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {existingSchedule ? 'Edit' : 'Add'} Payment Schedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Loan Type */}
          <div className="space-y-2">
            <Label>Loan Type</Label>
            <Select 
              value={formData.loan_type} 
              onValueChange={(value: any) => setFormData({ ...formData, loan_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Principal & Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Principal Amount</Label>
              <Input
                type="number"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
              />
            </div>
          </div>
          
          {/* Rate Type & Term */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rate Type</Label>
              <Select 
                value={formData.rate_type} 
                onValueChange={(value: any) => setFormData({ ...formData, rate_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term (months)</Label>
              <Input
                type="number"
                value={formData.term_months}
                onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
              />
            </div>
          </div>
          
          {/* Start Date & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Payment Frequency</Label>
              <Select 
                value={formData.payment_frequency} 
                onValueChange={(value: any) => setFormData({ ...formData, payment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Calculate Button */}
          <div className="pt-2">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCalculate}
              className="w-full"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Monthly Payment
            </Button>
            
            {calculatedPayment !== null && (
              <div className="mt-3 p-3 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                <p className="text-2xl font-semibold text-foreground">
                  {calculatedPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Generate Schedule'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
