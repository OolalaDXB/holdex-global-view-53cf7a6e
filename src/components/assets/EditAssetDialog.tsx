import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Moon, MapPin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountrySelect } from '@/components/ui/country-select';
import { EntitySelect } from '@/components/entities/EntitySelect';
import { ImageUpload } from '@/components/ui/image-upload';
import { AIImageDialog } from '@/components/ui/ai-image-dialog';
import { DocumentsSection } from '@/components/documents/DocumentsSection';
import { Switch } from '@/components/ui/switch';
import { useUpdateAsset, Asset } from '@/hooks/useAssets';
import { useEntities } from '@/hooks/useEntities';
import { useComplianceMode } from '@/hooks/useComplianceMode';
import { useGeocode } from '@/hooks/useGeocode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EditAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB'];

export function EditAssetDialog({ asset, open, onOpenChange }: EditAssetDialogProps) {
  const { toast } = useToast();
  const updateAsset = useUpdateAsset();
  const { data: entities } = useEntities();
  const { showIslamic } = useComplianceMode();
  const { geocodeAddress, isGeocoding } = useGeocode();
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
    platform: '',
    institution: '',
    rental_income: '',
    image_url: null as string | null,
    reference_balance: '',
    reference_date: null as Date | null,
    entity_id: null as string | null,
    is_shariah_compliant: false,
    shariah_certification: '',
    // UK tenure
    tenure_type: 'freehold',
    lease_end_date: null as Date | null,
    // Liquidity
    liquidity_status: 'liquid',
    // Location fields
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
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
        platform: asset.platform || '',
        institution: asset.institution || '',
        rental_income: asset.rental_income?.toString() || '',
        image_url: asset.image_url || null,
        reference_balance: asset.reference_balance?.toString() || '',
        reference_date: asset.reference_date ? new Date(asset.reference_date) : null,
        entity_id: asset.entity_id || null,
        is_shariah_compliant: asset.is_shariah_compliant || false,
        shariah_certification: asset.shariah_certification || '',
        tenure_type: (asset as any).tenure_type || 'freehold',
        lease_end_date: (asset as any).lease_end_date ? new Date((asset as any).lease_end_date) : null,
        liquidity_status: (asset as any).liquidity_status || 'liquid',
        address: (asset as any).address || '',
        latitude: (asset as any).latitude || null,
        longitude: (asset as any).longitude || null,
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
        current_value: parseFloat(formData.current_value) || 0,
        purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
        ownership_percentage: parseFloat(formData.ownership_percentage) || 100,
        ticker: formData.ticker || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        platform: formData.platform || null,
        institution: formData.institution || null,
        rental_income: formData.rental_income ? parseFloat(formData.rental_income) : null,
        image_url: formData.image_url,
        reference_balance: formData.reference_balance ? parseFloat(formData.reference_balance) : null,
        reference_date: formData.reference_date ? format(formData.reference_date, 'yyyy-MM-dd') : null,
        entity_id: formData.entity_id,
        is_shariah_compliant: formData.is_shariah_compliant,
        shariah_certification: formData.shariah_certification || null,
        tenure_type: asset.type === 'real-estate' ? formData.tenure_type : null,
        lease_end_date: formData.lease_end_date ? format(formData.lease_end_date, 'yyyy-MM-dd') : null,
        liquidity_status: formData.liquidity_status,
        address: asset.type === 'real-estate' ? (formData.address || null) : null,
        latitude: asset.type === 'real-estate' ? formData.latitude : null,
        longitude: asset.type === 'real-estate' ? formData.longitude : null,
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
    }
  };

  if (!asset) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Asset</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText size={14} />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    assetId={asset.id}
                    onGenerateAI={() => setShowAIDialog(true)}
                    hideAIButton={asset.type === 'real-estate'}
                  />
                </div>

                {/* Address field for Real Estate */}
                {asset.type === 'real-estate' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g., 123 Marina Walk, Dubai Marina"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          const result = await geocodeAddress(formData.address);
                          if (result) {
                            setFormData({ ...formData, latitude: result.lat, longitude: result.lon });
                            toast({ title: "Location found", description: "Coordinates set for map display." });
                          } else {
                            toast({ variant: "destructive", title: "Location not found", description: "Could not geocode this address." });
                          }
                        }}
                        disabled={isGeocoding || !formData.address.trim()}
                      >
                        {isGeocoding ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      </Button>
                    </div>
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-muted-foreground">📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>
                    )}
                  </div>
                )}

                {/* Embedded Mini-Map for Real Estate with coordinates */}
                {asset.type === 'real-estate' && formData.latitude && formData.longitude && (
                  <div className="space-y-2">
                    <Label>Location Map</Label>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.01},${formData.latitude - 0.007},${formData.longitude + 0.01},${formData.latitude + 0.007}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                        className="w-full h-full border-0"
                        title={`Map of ${formData.name}`}
                        loading="lazy"
                      />
                      <a
                        href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
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

                  <div className="space-y-2 col-span-2">
                    <Label>Owner</Label>
                    <EntitySelect
                      value={formData.entity_id}
                      onChange={(value) => setFormData({ ...formData, entity_id: value })}
                      placeholder="Select owner"
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
                      <div className="space-y-2">
                        <Label htmlFor="edit-platform">Platform</Label>
                        <Select 
                          value={formData.platform} 
                          onValueChange={(value) => setFormData({ ...formData, platform: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Ledger', 'Binance', 'Coinbase', 'Kraken', 'Crypto.com', 'MetaMask', 'Trust Wallet', 'Other'].map((platform) => (
                              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                  {/* Shariah Compliance for investments */}
                  {/* Shariah Compliance for investments - only show if Islamic mode enabled */}
                  {asset.type === 'investment' && showIslamic && (
                    <>
                      <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <Moon size={18} className={formData.is_shariah_compliant ? 'text-positive' : 'text-muted-foreground'} />
                          <div>
                            <Label className="text-sm font-medium">Shariah Compliant</Label>
                            <p className="text-xs text-muted-foreground">Mark this investment as Shariah compliant</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.is_shariah_compliant}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_shariah_compliant: checked })}
                        />
                      </div>
                      {formData.is_shariah_compliant && (
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="edit-shariah-cert">Certification (optional)</Label>
                          <Input
                            id="edit-shariah-cert"
                            value={formData.shariah_certification}
                            onChange={(e) => setFormData({ ...formData, shariah_certification: e.target.value })}
                            placeholder="e.g., AAOIFI Compliant"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* UK Tenure Type for Real Estate */}
                  {asset.type === 'real-estate' && (
                    <>
                      <div className="space-y-2">
                        <Label>Tenure Type</Label>
                        <Select 
                          value={formData.tenure_type} 
                          onValueChange={(value) => setFormData({ ...formData, tenure_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="freehold">Freehold</SelectItem>
                            <SelectItem value="leasehold">Leasehold</SelectItem>
                            <SelectItem value="share_of_freehold">Share of Freehold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Lease End Date for Leasehold */}
                      {formData.tenure_type === 'leasehold' && (
                        <div className="space-y-2">
                          <Label>Lease End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.lease_end_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.lease_end_date ? format(formData.lease_end_date, 'dd/MM/yyyy') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.lease_end_date || undefined}
                                onSelect={(date) => setFormData({ ...formData, lease_end_date: date || null })}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          {formData.lease_end_date && (() => {
                            const yearsRemaining = Math.floor((formData.lease_end_date.getTime() - new Date().getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                            if (yearsRemaining < 80) {
                              return (
                                <p className="text-xs text-warning">
                                  ⚠️ {yearsRemaining} years remaining - below 80-year mortgage threshold
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </>
                  )}

                  {/* Liquidity Status */}
                  <div className="col-span-2 space-y-2 pt-4 border-t border-border">
                    <Label>Liquidity Status</Label>
                    <Select 
                      value={formData.liquidity_status} 
                      onValueChange={(value) => setFormData({ ...formData, liquidity_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="frozen">Frozen</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={updateAsset.isPending}>
                    {updateAsset.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsSection linkType="asset" linkId={asset.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AIImageDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        assetType={asset.type}
        name={formData.name}
        country={formData.country}
        onImageGenerated={(url) => setFormData({ ...formData, image_url: url })}
      />
    </>
  );
}
