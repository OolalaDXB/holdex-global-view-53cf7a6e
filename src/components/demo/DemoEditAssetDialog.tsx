import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { Asset } from '@/hooks/useAssets';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';

interface DemoEditAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'GEL'];

export function DemoEditAssetDialog({ asset, open, onOpenChange }: DemoEditAssetDialogProps) {
  const { toast } = useToast();
  const { updateAsset } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'EUR',
    current_value: '',
    purchase_value: '',
    ownership_percentage: '100',
    ticker: '',
    quantity: '',
    institution: '',
    rental_income: '',
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        country: asset.country,
        currency: asset.currency,
        current_value: asset.current_value.toString(),
        purchase_value: asset.purchase_value?.toString() || '',
        ownership_percentage: asset.ownership_percentage?.toString() || '100',
        ticker: asset.ticker || '',
        quantity: asset.quantity?.toString() || '',
        institution: asset.institution || '',
        rental_income: asset.rental_income?.toString() || '',
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setIsSubmitting(true);
    try {
      updateAsset(asset.id, {
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
        current_value: parseFloat(formData.current_value) || 0,
        purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
        ownership_percentage: parseFloat(formData.ownership_percentage) || 100,
        ticker: formData.ticker || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        institution: formData.institution || null,
        rental_income: formData.rental_income ? parseFloat(formData.rental_income) : null,
      });

      toast({
        title: "Asset updated",
        description: `${formData.name} has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update asset. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Asset (Demo)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <CountrySelect
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-current-value">Current Value</Label>
              <Input
                id="edit-current-value"
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                required
              />
            </div>

            {asset.type === 'crypto' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-ticker">Token</Label>
                  <Input
                    id="edit-ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="0.0001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </>
            )}

            {asset.type === 'business' && (
              <div className="space-y-2">
                <Label htmlFor="edit-ownership">Ownership %</Label>
                <Input
                  id="edit-ownership"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.ownership_percentage}
                  onChange={(e) => setFormData({ ...formData, ownership_percentage: e.target.value })}
                />
              </div>
            )}

            {asset.type === 'real-estate' && (
              <div className="space-y-2">
                <Label htmlFor="edit-rental">Annual Rental Income</Label>
                <Input
                  id="edit-rental"
                  type="number"
                  value={formData.rental_income}
                  onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })}
                />
              </div>
            )}

            {(asset.type === 'bank' || asset.type === 'investment') && (
              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution</Label>
                <Input
                  id="edit-institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-purchase">Purchase Price</Label>
              <Input
                id="edit-purchase"
                type="number"
                value={formData.purchase_value}
                onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
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
