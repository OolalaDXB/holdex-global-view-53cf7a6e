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
import { Switch } from '@/components/ui/switch';
import { CountrySelect } from '@/components/ui/country-select';
import { DemoEntitySelect } from '@/components/demo/DemoEntitySelect';
import { getFilteredFinancingTypes, isIslamicFinancing } from '@/hooks/useLiabilities';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DemoLiability } from '@/data/demoData';

interface DemoLiabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liability?: DemoLiability | null;
}

const currencies = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB'];

// Use centralized LIABILITY_TYPES from useLiabilities hook
import { LIABILITY_TYPES } from '@/hooks/useLiabilities';

export function DemoLiabilityDialog({ open, onOpenChange, liability }: DemoLiabilityDialogProps) {
  const { toast } = useToast();
  const { assets, addLiability, updateLiability, profile } = useDemo();
  const isEditing = !!liability;

  const showIslamic = profile.compliance_mode === 'islamic' || profile.compliance_mode === 'all';
  const showJewish = profile.compliance_mode === 'jewish' || profile.compliance_mode === 'all';
  const filteredFinancingTypes = getFilteredFinancingTypes(showIslamic, showJewish);

  const [formData, setFormData] = useState({
    name: '',
    type: 'mortgage',
    institution: '',
    currency: 'EUR',
    original_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    country: '',
    financing_type: 'conventional',
    is_shariah_compliant: false,
    shariah_advisor: '',
    linked_asset_id: null as string | null,
    entity_id: null as string | null,
    notes: '',
  });

  useEffect(() => {
    if (liability) {
      setFormData({
        name: liability.name,
        type: liability.type,
        institution: liability.institution || '',
        currency: liability.currency,
        original_amount: liability.original_amount?.toString() || '',
        current_balance: liability.current_balance.toString(),
        interest_rate: liability.interest_rate?.toString() || '',
        monthly_payment: liability.monthly_payment?.toString() || '',
        start_date: liability.start_date ? new Date(liability.start_date) : null,
        end_date: liability.end_date ? new Date(liability.end_date) : null,
        country: liability.country,
        financing_type: liability.financing_type || 'conventional',
        is_shariah_compliant: liability.is_shariah_compliant || false,
        shariah_advisor: liability.shariah_advisor || '',
        linked_asset_id: liability.linked_asset_id,
        entity_id: liability.entity_id,
        notes: liability.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'mortgage',
        institution: '',
        currency: 'EUR',
        original_amount: '',
        current_balance: '',
        interest_rate: '',
        monthly_payment: '',
        start_date: null,
        end_date: null,
        country: '',
        financing_type: 'conventional',
        is_shariah_compliant: false,
        shariah_advisor: '',
        linked_asset_id: null,
        entity_id: null,
        notes: '',
      });
    }
  }, [liability, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isIslamic = isIslamicFinancing(formData.financing_type);
    
    const payload = {
      name: formData.name,
      type: formData.type,
      institution: formData.institution || null,
      currency: formData.currency,
      original_amount: formData.original_amount ? parseFloat(formData.original_amount) : null,
      current_balance: parseFloat(formData.current_balance),
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      monthly_payment: formData.monthly_payment ? parseFloat(formData.monthly_payment) : null,
      start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
      end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
      country: formData.country,
      financing_type: formData.financing_type,
      is_shariah_compliant: isIslamic || formData.is_shariah_compliant,
      shariah_advisor: formData.shariah_advisor || null,
      linked_asset_id: formData.linked_asset_id,
      entity_id: formData.entity_id,
      notes: formData.notes || null,
    };

    if (isEditing && liability) {
      updateLiability(liability.id, payload);
      toast({ title: 'Liability updated' });
    } else {
      addLiability(payload);
      toast({ title: 'Liability created' });
    }
    onOpenChange(false);
  };

  const showIslamicFields = isIslamicFinancing(formData.financing_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Liability' : 'Add Liability'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Mortgage"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIABILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g., HSBC, Chase"
              />
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
                onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Current Balance *</Label>
              <Input
                type="number"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Monthly Payment</Label>
              <Input
                type="number"
                value={formData.monthly_payment}
                onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <CountrySelect
                value={formData.country}
                onValueChange={(v) => setFormData({ ...formData, country: v })}
                placeholder="Select country"
              />
            </div>

            <div className="space-y-2">
              <Label>Financing Type</Label>
              <Select value={formData.financing_type} onValueChange={(v) => setFormData({ ...formData, financing_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filteredFinancingTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showIslamicFields && (
              <div className="space-y-2">
                <Label>Shariah Advisor</Label>
                <Input
                  value={formData.shariah_advisor}
                  onChange={(e) => setFormData({ ...formData, shariah_advisor: e.target.value })}
                  placeholder="e.g., Bank's Shariah Board"
                />
              </div>
            )}

            {!showIslamicFields && showIslamic && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_shariah_compliant}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_shariah_compliant: checked })}
                />
                <Label>Shariah Compliant</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label>Linked Asset (optional)</Label>
              <Select 
                value={formData.linked_asset_id || 'none'} 
                onValueChange={(v) => setFormData({ ...formData, linked_asset_id: v === 'none' ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {assets?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Owner (optional)</Label>
              <DemoEntitySelect
                value={formData.entity_id}
                onChange={(v) => setFormData({ ...formData, entity_id: v })}
                placeholder="Select owner"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update' : 'Add Liability'}
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
