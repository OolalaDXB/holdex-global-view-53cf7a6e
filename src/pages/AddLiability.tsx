import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCreateLiability, FINANCING_TYPES } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useAssets } from '@/hooks/useAssets';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceMode } from '@/hooks/useComplianceMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CountrySelect } from '@/components/ui/country-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const LIABILITY_TYPES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'business_loan', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR'];

const AddLiabilityPage = () => {
  const navigate = useNavigate();
  const createLiability = useCreateLiability();
  const { data: entities = [] } = useEntities();
  const { data: assets = [] } = useAssets();
  const { data: profile } = useProfile();
  const { showIslamic } = useComplianceMode();

  const [formData, setFormData] = useState({
    name: '',
    type: 'mortgage',
    institution: '',
    currency: profile?.base_currency || 'EUR',
    original_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    start_date: '',
    end_date: '',
    country: 'AE',
    financing_type: 'conventional',
    is_shariah_compliant: false,
    shariah_advisor: '',
    linked_asset_id: '',
    entity_id: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.current_balance) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createLiability.mutateAsync({
        name: formData.name,
        type: formData.type,
        institution: formData.institution || null,
        currency: formData.currency,
        original_amount: formData.original_amount ? parseFloat(formData.original_amount) : null,
        current_balance: parseFloat(formData.current_balance),
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        monthly_payment: formData.monthly_payment ? parseFloat(formData.monthly_payment) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        country: formData.country,
        financing_type: formData.financing_type,
        is_shariah_compliant: formData.is_shariah_compliant,
        shariah_advisor: formData.shariah_advisor || null,
        linked_asset_id: formData.linked_asset_id || null,
        entity_id: formData.entity_id || null,
        notes: formData.notes || null,
      });
      toast.success('Liability added successfully');
      navigate('/liabilities');
    } catch (error) {
      toast.error('Failed to add liability');
    }
  };

  const realEstateAssets = assets.filter(a => a.type === 'real-estate');

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/liabilities')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Liabilities
        </Button>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendingDown className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-foreground">Add Liability</h1>
          </div>
          <p className="text-muted-foreground">
            Track mortgages, loans, and other financial obligations.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Liability Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Home Mortgage"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIABILITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_balance">Current Balance *</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_amount">Original Amount</Label>
                  <Input
                    id="original_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.original_amount}
                    onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="4.5"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_payment">Monthly Payment</Label>
                  <Input
                    id="monthly_payment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monthly_payment}
                    onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    placeholder="e.g., HSBC, Emirates NBD"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Location & Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <CountrySelect
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  />
                </div>

                {realEstateAssets.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="linked_asset">Linked Asset</Label>
                    <Select
                      value={formData.linked_asset_id}
                      onValueChange={(value) => setFormData({ ...formData, linked_asset_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {realEstateAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {entities.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="entity">Owner</Label>
                    <Select
                      value={formData.entity_id}
                      onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Islamic Finance Options */}
              {showIslamic && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Islamic Finance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="financing_type">Financing Type</Label>
                      <Select
                        value={formData.financing_type}
                        onValueChange={(value) => setFormData({ ...formData, financing_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCING_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shariah_advisor">Shariah Advisor</Label>
                      <Input
                        id="shariah_advisor"
                        placeholder="Advisor name"
                        value={formData.shariah_advisor}
                        onChange={(e) => setFormData({ ...formData, shariah_advisor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shariah_compliant"
                      checked={formData.is_shariah_compliant}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_shariah_compliant: checked })}
                    />
                    <Label htmlFor="shariah_compliant">Shariah Compliant</Label>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/liabilities')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLiability.isPending}>
                  {createLiability.isPending ? 'Adding...' : 'Add Liability'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AddLiabilityPage;
