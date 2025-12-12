import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collection } from '@/hooks/useCollections';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';

interface DemoEditCollectionDialogProps {
  collection: Collection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'GEL'];
const countries = ['UAE', 'Portugal', 'France', 'Germany', 'Switzerland', 'USA', 'UK', 'Botswana', 'Russia', 'Global', 'Georgia', 'Netherlands'];

export function DemoEditCollectionDialog({ collection, open, onOpenChange }: DemoEditCollectionDialogProps) {
  const { toast } = useToast();
  const { updateCollection } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'EUR',
    current_value: '',
    purchase_value: '',
    brand: '',
    model: '',
    year: '',
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        country: collection.country,
        currency: collection.currency,
        current_value: collection.current_value.toString(),
        purchase_value: collection.purchase_value?.toString() || '',
        brand: collection.brand || '',
        model: collection.model || '',
        year: collection.year?.toString() || '',
      });
    }
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;

    setIsSubmitting(true);
    try {
      updateCollection(collection.id, {
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
        current_value: parseFloat(formData.current_value) || 0,
        purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
        brand: formData.brand || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
      });

      toast({
        title: "Collection updated",
        description: `${formData.name} has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update collection. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Collection (Demo)</DialogTitle>
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
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>

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
