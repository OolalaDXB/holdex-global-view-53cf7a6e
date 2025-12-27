import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EntitySelect } from '@/components/entities/EntitySelect';
import { CertaintySelect } from '@/components/ui/certainty-select';
import { useCreateReceivable, useUpdateReceivable, Receivable } from '@/hooks/useReceivables';
import { useAssets } from '@/hooks/useAssets';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CertaintyLevel, getDefaultCertainty } from '@/lib/certainty';
import { useCurrencyList } from '@/hooks/useCurrencyList';
import { DocumentsSection } from '@/components/documents/DocumentsSection';

interface ReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable?: Receivable | null;
}

const receivableTypes = [
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'business_loan', label: 'Business Loan' },
  { value: 'expense_reimbursement', label: 'Expense Reimbursement' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'advance', label: 'Advance' },
  { value: 'other', label: 'Other' },
];

const debtorTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'employer', label: 'Employer' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'service_provider', label: 'Service Provider' },
];

const depositTypes = [
  { value: 'rental', label: 'Rental Deposit' },
  { value: 'utility', label: 'Utility Deposit' },
  { value: 'service', label: 'Service Deposit' },
  { value: 'security', label: 'Security Deposit' },
];

export function ReceivableDialog({ open, onOpenChange, receivable }: ReceivableDialogProps) {
  const { toast } = useToast();
  const createReceivable = useCreateReceivable();
  const updateReceivable = useUpdateReceivable();
  const { data: assets } = useAssets();
  const currencies = useCurrencyList();
  const isEditing = !!receivable;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'personal_loan',
    debtor_name: '',
    debtor_type: 'individual',
    debtor_contact: '',
    currency: 'EUR',
    original_amount: '',
    current_balance: '',
    issue_date: null as Date | null,
    due_date: null as Date | null,
    repayment_schedule: 'one_time',
    interest_rate: '',
    status: 'pending',
    recovery_probability: 'likely',
    certainty: 'contractual' as string,
    linked_asset_id: null as string | null,
    deposit_type: 'rental',
    refund_conditions: '',
    entity_id: null as string | null,
    notes: '',
  });

  useEffect(() => {
    if (receivable) {
      setFormData({
        name: receivable.name,
        description: receivable.description || '',
        type: receivable.type,
        debtor_name: receivable.debtor_name,
        debtor_type: receivable.debtor_type || 'individual',
        debtor_contact: receivable.debtor_contact || '',
        currency: receivable.currency,
        original_amount: receivable.original_amount.toString(),
        current_balance: receivable.current_balance.toString(),
        issue_date: receivable.issue_date ? new Date(receivable.issue_date) : null,
        due_date: receivable.due_date ? new Date(receivable.due_date) : null,
        repayment_schedule: receivable.repayment_schedule || 'one_time',
        interest_rate: receivable.interest_rate?.toString() || '',
        status: receivable.status,
        recovery_probability: receivable.recovery_probability || 'likely',
        certainty: receivable.certainty || 'contractual',
        linked_asset_id: receivable.linked_asset_id || null,
        deposit_type: receivable.deposit_type || 'rental',
        refund_conditions: receivable.refund_conditions || '',
        entity_id: receivable.entity_id || null,
        notes: receivable.notes || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'personal_loan',
        debtor_name: '',
        debtor_type: 'individual',
        debtor_contact: '',
        currency: 'EUR',
        original_amount: '',
        current_balance: '',
        issue_date: null,
        due_date: null,
        repayment_schedule: 'one_time',
        interest_rate: '',
        status: 'pending',
        recovery_probability: 'likely',
        certainty: 'contractual',
        linked_asset_id: null,
        deposit_type: 'rental',
        refund_conditions: '',
        entity_id: null,
        notes: '',
      });
    }
  }, [receivable, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      debtor_name: formData.debtor_name,
      debtor_type: formData.debtor_type,
      debtor_contact: formData.debtor_contact || null,
      currency: formData.currency,
      original_amount: parseFloat(formData.original_amount),
      current_balance: parseFloat(formData.current_balance || formData.original_amount),
      issue_date: formData.issue_date ? format(formData.issue_date, 'yyyy-MM-dd') : null,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
      repayment_schedule: formData.type === 'personal_loan' || formData.type === 'business_loan' ? formData.repayment_schedule : null,
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      status: formData.status,
      recovery_probability: formData.recovery_probability,
      certainty: formData.certainty,
      linked_asset_id: formData.type === 'deposit' ? formData.linked_asset_id : null,
      deposit_type: formData.type === 'deposit' ? formData.deposit_type : null,
      refund_conditions: formData.type === 'deposit' ? formData.refund_conditions || null : null,
      entity_id: formData.entity_id,
      notes: formData.notes || null,
    };

    try {
      if (isEditing) {
        await updateReceivable.mutateAsync({ id: receivable.id, ...payload });
        toast({ title: 'Receivable updated' });
      } else {
        await createReceivable.mutateAsync(payload);
        toast({ title: 'Receivable created' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save receivable' });
    }
  };

  const isDeposit = formData.type === 'deposit';
  const isLoan = formData.type === 'personal_loan' || formData.type === 'business_loan';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Receivable' : 'Add Receivable'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Loan to Pierre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => {
                  // Auto-suggest certainty based on type
                  const suggestedCertainty = getDefaultCertainty(v, { recoveryProbability: formData.recovery_probability });
                  setFormData({ ...formData, type: v, certainty: suggestedCertainty });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {receivableTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Debtor Name</Label>
              <Input
                value={formData.debtor_name}
                onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                placeholder="e.g., Pierre Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Debtor Type</Label>
              <Select value={formData.debtor_type} onValueChange={(v) => setFormData({ ...formData, debtor_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {debtorTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Original Amount</Label>
              <Input
                type="number"
                value={formData.original_amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  original_amount: e.target.value,
                  current_balance: isEditing ? formData.current_balance : e.target.value
                })}
                placeholder="0"
                required
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label>Current Balance</Label>
                <Input
                  type="number"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.due_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, due_date: date || null })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recovery Probability</Label>
              <Select 
                value={formData.recovery_probability} 
                onValueChange={(v) => {
                  // Update certainty based on recovery probability for loans
                  const isLoanType = formData.type === 'personal_loan' || formData.type === 'business_loan';
                  const newCertainty = isLoanType ? getDefaultCertainty(formData.type, { recoveryProbability: v }) : formData.certainty;
                  setFormData({ ...formData, recovery_probability: v, certainty: newCertainty });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certain">Certain</SelectItem>
                  <SelectItem value="likely">Likely</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                  <SelectItem value="doubtful">Doubtful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CertaintySelect
              value={formData.certainty}
              onValueChange={(v) => setFormData({ ...formData, certainty: v })}
              showLabel={true}
            />

            <div className="space-y-2">
              <Label>Owner (optional)</Label>
              <EntitySelect
                value={formData.entity_id}
                onChange={(v) => setFormData({ ...formData, entity_id: v })}
                placeholder="Select owner"
              />
            </div>

            {/* Loan-specific fields */}
            {isLoan && (
              <>
                <div className="space-y-2">
                  <Label>Repayment Schedule</Label>
                  <Select value={formData.repayment_schedule} onValueChange={(v) => setFormData({ ...formData, repayment_schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* Deposit-specific fields */}
            {isDeposit && (
              <>
                <div className="space-y-2">
                  <Label>Deposit Type</Label>
                  <Select value={formData.deposit_type} onValueChange={(v) => setFormData({ ...formData, deposit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {depositTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Linked Property (optional)</Label>
                  <Select 
                    value={formData.linked_asset_id || 'none'} 
                    onValueChange={(v) => setFormData({ ...formData, linked_asset_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assets?.filter(a => a.type === 'real-estate').map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Refund Conditions</Label>
                  <Textarea
                    value={formData.refund_conditions}
                    onChange={(e) => setFormData({ ...formData, refund_conditions: e.target.value })}
                    placeholder="e.g., Refundable within 30 days of lease termination"
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {/* Documents Section - only show when editing */}
            {isEditing && receivable && (
              <div className="md:col-span-2 pt-4 border-t border-border">
                <DocumentsSection linkType="receivable" linkId={receivable.id} />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update' : 'Add Receivable'}
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
