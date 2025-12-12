import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { LoanPayment, useMarkPaymentPaid } from '@/hooks/useLoanSchedules';

interface MarkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: LoanPayment;
  scheduleId: string;
  currency: string;
}

export function MarkPaymentDialog({
  open,
  onOpenChange,
  payment,
  scheduleId,
  currency,
}: MarkPaymentDialogProps) {
  const { toast } = useToast();
  const markPaid = useMarkPaymentPaid();
  
  const [actualAmount, setActualAmount] = useState(payment.total_amount?.toString() || '');
  const [actualDate, setActualDate] = useState<Date>(new Date());
  
  const handleSubmit = async () => {
    try {
      await markPaid.mutateAsync({
        paymentId: payment.id,
        scheduleId,
        actualAmount: parseFloat(actualAmount) || undefined,
        actualDate: format(actualDate, 'yyyy-MM-dd'),
      });
      
      toast({
        title: 'Payment recorded',
        description: `Payment #${payment.payment_number} marked as paid`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record payment',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Record Payment #{payment.payment_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scheduled Amount</span>
              <span className="font-medium">{formatCurrency(payment.total_amount || 0, currency)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Due Date</span>
              <span>{format(parseISO(payment.payment_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Actual Amount Paid</Label>
            <Input
              type="number"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              placeholder={payment.total_amount?.toString()}
            />
            <p className="text-xs text-muted-foreground">
              Leave as-is if the scheduled amount was paid
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(actualDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={actualDate}
                  onSelect={(date) => date && setActualDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={markPaid.isPending}
              className="flex-1"
            >
              {markPaid.isPending ? 'Recording...' : 'Mark as Paid'}
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
