import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  usePaymentSchedules,
  useCreatePaymentSchedule,
  useUpdatePaymentSchedule,
  useDeletePaymentSchedule,
  useBulkCreatePaymentSchedules,
} from '@/hooks/usePaymentSchedules';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PaymentScheduleDialogProps {
  assetId: string;
  assetName: string;
  totalPrice: number;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_TEMPLATES = [
  {
    name: 'Standard 60/40',
    description: '60% during construction, 40% on handover',
    payments: [
      { description: 'Booking', percentage: 10 },
      { description: '1st Installment', percentage: 10 },
      { description: '2nd Installment', percentage: 10 },
      { description: '3rd Installment', percentage: 10 },
      { description: '4th Installment', percentage: 10 },
      { description: '5th Installment', percentage: 10 },
      { description: 'On Handover', percentage: 40 },
    ],
  },
  {
    name: 'Post-Handover 3 Years',
    description: '40% during construction, 60% post-handover',
    payments: [
      { description: 'Booking', percentage: 10 },
      { description: '1st Installment', percentage: 10 },
      { description: '2nd Installment', percentage: 10 },
      { description: '3rd Installment', percentage: 10 },
      { description: 'On Handover', percentage: 20 },
      { description: 'Post-Handover 1', percentage: 10 },
      { description: 'Post-Handover 2', percentage: 10 },
      { description: 'Post-Handover 3', percentage: 10 },
      { description: 'Post-Handover 4', percentage: 10 },
    ],
  },
];

export function PaymentScheduleDialog({
  assetId,
  assetName,
  totalPrice,
  currency,
  open,
  onOpenChange,
}: PaymentScheduleDialogProps) {
  const { toast } = useToast();
  const { data: payments, isLoading } = usePaymentSchedules(assetId);
  const createPayment = useCreatePaymentSchedule();
  const updatePayment = useUpdatePaymentSchedule();
  const deletePayment = useDeletePaymentSchedule();
  const bulkCreate = useBulkCreatePaymentSchedules();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    description: '',
    due_date: null as Date | null,
    amount: '',
    percentage: '',
  });

  const paidAmount = payments?.reduce((sum, p) => 
    p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
  const progressPercent = totalPrice > 0 ? (paidAmount / totalPrice) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'paid';
    
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.due_date || !newPayment.amount) return;

    try {
      await createPayment.mutateAsync({
        asset_id: assetId,
        payment_number: (payments?.length || 0) + 1,
        description: newPayment.description || null,
        due_date: format(newPayment.due_date, 'yyyy-MM-dd'),
        amount: parseFloat(newPayment.amount),
        currency: currency,
        percentage: newPayment.percentage ? parseFloat(newPayment.percentage) : null,
        status: 'pending',
        paid_date: null,
        paid_amount: null,
        payment_reference: null,
        receipt_url: null,
        notes: null,
      });
      
      setNewPayment({ description: '', due_date: null, amount: '', percentage: '' });
      setShowAddForm(false);
      toast({ title: 'Payment added' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add payment' });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await updatePayment.mutateAsync({
        id: paymentId,
        status: 'paid',
        paid_date: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({ title: 'Payment marked as paid' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update payment' });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync({ id: paymentId, assetId });
      toast({ title: 'Payment deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete payment' });
    }
  };

  const handleApplyTemplate = async (templateIndex: number) => {
    const template = PAYMENT_TEMPLATES[templateIndex];
    const today = new Date();
    
    const paymentsToCreate = template.payments.map((p, i) => ({
      asset_id: assetId,
      payment_number: i + 1,
      description: p.description,
      due_date: format(new Date(today.getFullYear(), today.getMonth() + (i * 3), 1), 'yyyy-MM-dd'),
      amount: (totalPrice * p.percentage) / 100,
      currency: currency,
      percentage: p.percentage,
      status: 'scheduled' as const,
      paid_date: null,
      paid_amount: null,
      payment_reference: null,
      receipt_url: null,
      notes: null,
    }));

    try {
      await bulkCreate.mutateAsync(paymentsToCreate);
      toast({ title: 'Payment schedule created' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create schedule' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Payment Schedule</DialogTitle>
          <p className="text-sm text-muted-foreground">{assetName}</p>
        </DialogHeader>

        {/* Progress Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {formatCurrency(paidAmount)} / {formatCurrency(totalPrice)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progressPercent.toFixed(1)}% paid
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">
                    #{payment.payment_number}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {payment.description || `Payment ${payment.payment_number}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.due_date), 'MMM d, yyyy')}
                      {payment.percentage && ` • ${payment.percentage}%`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  {getStatusBadge(payment.status, payment.due_date)}
                  <div className="flex gap-1">
                    {payment.status !== 'paid' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleMarkAsPaid(payment.id)}
                      >
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDeletePayment(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">No payment schedule yet</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick templates:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {PAYMENT_TEMPLATES.map((template, i) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(i)}
                    disabled={bulkCreate.isPending}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Form */}
        {showAddForm ? (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  placeholder="e.g., 1st Installment"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newPayment.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPayment.due_date ? format(newPayment.due_date, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newPayment.due_date || undefined}
                      onSelect={(date) => setNewPayment({ ...newPayment, due_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Amount ({currency})</Label>
                <Input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage (%)</Label>
                <Input
                  type="number"
                  value={newPayment.percentage}
                  onChange={(e) => setNewPayment({ ...newPayment, percentage: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPayment} disabled={createPayment.isPending}>
                Add Payment
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
