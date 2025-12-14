import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CountrySelect } from '@/components/ui/country-select';
import { ImageUpload } from '@/components/ui/image-upload';
import { AIImageDialog } from '@/components/ui/ai-image-dialog';
import { DemoEntitySelect } from '@/components/demo/DemoEntitySelect';
import { CertaintySelect } from '@/components/ui/certainty-select';
import { Asset } from '@/hooks/useAssets';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDemoCurrencyList } from '@/hooks/useCurrencyList';

interface DemoEditAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoEditAssetDialog({ asset, open, onOpenChange }: DemoEditAssetDialogProps) {
  const { toast } = useToast();
  const { updateAsset, profile } = useDemo();
  const currencies = useDemoCurrencyList(profile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showAIDialog, setShowAIDialog] = useState(false);
  
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
    image_url: null as string | null,
    reference_balance: '',
    reference_date: null as Date | null,
    entity_id: null as string | null,
    address: '',
    property_type: '',
    rooms: '',
    size_sqm: '',
    certainty: 'certain',
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
        image_url: asset.image_url || null,
        reference_balance: asset.reference_balance?.toString() || '',
        reference_date: asset.reference_date ? new Date(asset.reference_date) : null,
        entity_id: asset.entity_id || null,
        address: (asset as any).address || '',
        property_type: (asset as any).property_type || '',
        rooms: (asset as any).rooms?.toString() || '',
        size_sqm: (asset as any).size_sqm?.toString() || '',
        certainty: asset.certainty || 'certain',
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
        image_url: formData.image_url,
        reference_balance: formData.reference_balance ? parseFloat(formData.reference_balance) : null,
        reference_date: formData.reference_date ? format(formData.reference_date, 'yyyy-MM-dd') : null,
        entity_id: formData.entity_id,
        address: formData.address || null,
        property_type: asset.type === 'real-estate' ? (formData.property_type || null) : null,
        rooms: asset.type === 'real-estate' && formData.rooms ? parseInt(formData.rooms) : null,
        size_sqm: asset.type === 'real-estate' && formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        certainty: formData.certainty,
      } as any);

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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Asset (Demo)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              assetId={asset.id}
              onGenerateAI={() => setShowAIDialog(true)}
              hideAIButton={asset.type === 'real-estate'}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Owner</Label>
            <DemoEntitySelect
              value={formData.entity_id || ''}
              onChange={(value) => setFormData({ ...formData, entity_id: value || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Certainty</Label>
            <CertaintySelect
              value={formData.certainty}
              onValueChange={(value) => setFormData({ ...formData, certainty: value })}
            />
          </div>

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
              <>
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select 
                    value={formData.property_type} 
                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rooms">Rooms</Label>
                  <Input
                    id="edit-rooms"
                    type="number"
                    min="0"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-size">Size (m²)</Label>
                  <Input
                    id="edit-size"
                    type="number"
                    min="0"
                    value={formData.size_sqm}
                    onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                    placeholder="e.g., 120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rental">Annual Rental Income</Label>
                  <Input
                    id="edit-rental"
                    type="number"
                    value={formData.rental_income}
                    onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Marina Walk, Dubai"
                  />
                </div>
                {/* Embedded Mini-Map for Real Estate with coordinates */}
                {(asset as any).latitude && (asset as any).longitude && (
                  <div className="space-y-2 col-span-2">
                    <Label>Location Map</Label>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(asset as any).longitude - 0.01},${(asset as any).latitude - 0.007},${(asset as any).longitude + 0.01},${(asset as any).latitude + 0.007}&layer=mapnik&marker=${(asset as any).latitude},${(asset as any).longitude}`}
                        className="w-full h-full border-0"
                        title={`Map of ${formData.name}`}
                        loading="lazy"
                      />
                      <a
                        href={`https://www.google.com/maps?q=${(asset as any).latitude},${(asset as any).longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/90 rounded text-xs text-foreground hover:bg-background transition-colors"
                      >
                        <MapPin size={12} />
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </>
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

            {asset.type === 'bank' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-reference-balance">Solde de référence</Label>
                  <Input
                    id="edit-reference-balance"
                    type="number"
                    value={formData.reference_balance}
                    onChange={(e) => setFormData({ ...formData, reference_balance: e.target.value })}
                    placeholder="Solde à comparer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de référence</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.reference_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.reference_date ? format(formData.reference_date, 'dd/MM/yyyy') : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.reference_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, reference_date: date || null })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {asset.type !== 'bank' && (
              <div className="space-y-2">
                <Label htmlFor="edit-purchase">Purchase Price</Label>
                <Input
                  id="edit-purchase"
                  type="number"
                  value={formData.purchase_value}
                  onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                />
              </div>
            )}
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
      
      <AIImageDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        assetType={asset.type}
        name={formData.name}
        brand={formData.institution}
        country={formData.country}
        onImageGenerated={(url) => setFormData({ ...formData, image_url: url })}
      />
    </Dialog>
  );
}
