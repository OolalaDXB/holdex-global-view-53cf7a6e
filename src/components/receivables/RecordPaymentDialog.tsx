import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateReceivablePayment, Receivable } from '@/hooks/useReceivables';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
}

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'crypto', label: 'Digital Assets' },
  { value: 'other', label: 'Other' },
];

export function RecordPaymentDialog({ open, onOpenChange, receivable }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const createPayment = useCreateReceivablePayment();

  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date(),
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivable) return;
    
    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }

    try {
      await createPayment.mutateAsync({
        receivable_id: receivable.id,
        amount,
        currency: receivable.currency,
        payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
        payment_method: formData.payment_method,
        reference: formData.reference || null,
        notes: formData.notes || null,
      });

      const newBalance = receivable.current_balance - amount;
      toast({ 
        title: 'Payment recorded',
        description: newBalance <= 0 
          ? 'Receivable marked as paid!'
          : `Remaining: ${formatCurrency(newBalance, receivable.currency)}`
      });
      
      setFormData({
        amount: '',
        payment_date: new Date(),
        payment_method: 'bank_transfer',
        reference: '',
        notes: '',
      });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to record payment' });
    }
  };

  if (!receivable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Receivable</p>
          <p className="font-medium">{receivable.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Balance: {formatCurrency(receivable.current_balance, receivable.currency)}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount ({receivable.currency})</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              max={receivable.current_balance}
              required
            />
            <p className="text-xs text-muted-foreground">
              Max: {formatCurrency(receivable.current_balance, receivable.currency)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.payment_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => setFormData({ ...formData, payment_date: date || new Date() })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g., Transfer #12345"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" className="flex-1" disabled={createPayment.isPending}>
              {createPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
