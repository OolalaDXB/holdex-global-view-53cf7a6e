import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, Moon, MapPin, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, TrendingDown, Watch, Car, Palette, Gem, Wine, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { CertaintySelect } from '@/components/ui/certainty-select';
import { EntitySelect, useDefaultEntity } from '@/components/entities/EntitySelect';
import { ImageUpload } from '@/components/ui/image-upload';
import { AIImageDialog } from '@/components/ui/ai-image-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateAsset } from '@/hooks/useAssets';
import { useCreateCollection } from '@/hooks/useCollections';
import { useCreateLiability, getFilteredFinancingTypes, isIslamicFinancing } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useComplianceMode } from '@/hooks/useComplianceMode';
import { useGeocode } from '@/hooks/useGeocode';
import { cn } from '@/lib/utils';
import { CertaintyLevel } from '@/lib/certainty';
import { useCurrencyList } from '@/hooks/useCurrencyList';

type Step = 'category' | 'type' | 'form';
type Category = 'wealth' | 'collections';

const wealthTypes = [
  { id: 'real-estate', label: 'Real Estate', icon: Building2, description: 'Properties and land' },
  { id: 'bank', label: 'Bank Account', icon: Landmark, description: 'Cash and deposits' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, description: 'Stocks, ETFs, bonds' },
  { id: 'crypto', label: 'Digital Assets', icon: Bitcoin, description: 'Tokens, NFTs, stablecoins' },
  { id: 'business', label: 'Business Equity', icon: Briefcase, description: 'Company ownership' },
  { id: 'liability', label: 'Liability', icon: TrendingDown, description: 'Debts and loans' },
];

const collectionTypes = [
  { id: 'watch', label: 'Watch', icon: Watch, description: 'Timepieces' },
  { id: 'vehicle', label: 'Vehicle', icon: Car, description: 'Cars and motorcycles' },
  { id: 'art', label: 'Art', icon: Palette, description: 'Paintings and sculptures' },
  { id: 'jewelry', label: 'Jewelry', icon: Gem, description: 'Fine jewelry' },
  { id: 'wine', label: 'Wine', icon: Wine, description: 'Wine collection' },
  { id: 'lp-position', label: 'LP Position', icon: BarChart3, description: 'Fund investments' },
];

const AddAssetPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createAsset = useCreateAsset();
  const createCollection = useCreateCollection();
  const createLiability = useCreateLiability();
  const { data: entities } = useEntities();
  const defaultEntityId = useDefaultEntity();
  const { showIslamic, showJewish } = useComplianceMode();
  const { geocodeAddress, isGeocoding } = useGeocode();
  const currencies = useCurrencyList();
  
  // Get filtered financing types based on compliance mode
  const filteredFinancingTypes = getFilteredFinancingTypes(showIslamic, showJewish);
  
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-select type from URL param
  useEffect(() => {
    if (typeParam === 'liability') {
      setCategory('wealth');
      setSelectedType('liability');
      setStep('form');
    }
  }, [typeParam]);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'EUR',
    currentValue: '',
    purchasePrice: '',
    ownershipPercent: '100',
    cryptoToken: '',
    cryptoQuantity: '',
    cryptoPlatform: '',
    notes: '',
    institution: '',
    referenceBalance: '',
    referenceDate: null as Date | null,
    entityId: undefined as string | null | undefined, // Will be set to default on mount
    certainty: 'certain',
    // Off-plan fields
    propertyStatus: 'owned',
    projectName: '',
    developer: '',
    unitNumber: '',
    totalPrice: '',
    amountPaid: '',
    expectedDelivery: null as Date | null,
    // Shariah compliance (for investments)
    isShariahCompliant: false,
    shariahCertification: '',
    // Islamic financing (for liabilities)
    financingType: 'conventional',
    monthlyRental: '',
    costPrice: '',
    profitMargin: '',
    bankOwnershipPercentage: '',
    residualValue: '',
    shariahAdvisor: '',
    // UK real estate tenure
    tenureType: 'freehold',
    leaseEndDate: null as Date | null,
    // Liquidity status
    liquidityStatus: 'liquid',
    // Location fields for real estate
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    // Property details for real estate
    propertyType: '',
    rooms: '',
    sizeSqm: '',
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tempAssetId] = useState<string>(() => crypto.randomUUID());
  const [showAIDialog, setShowAIDialog] = useState(false);

  // Types that support image upload
  const supportsImage = selectedType && ['real-estate', 'business', 'crypto'].includes(selectedType) || category === 'collections';

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setStep('type');
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !formData.country) return;
    
    setIsSubmitting(true);

    try {
      if (selectedType === 'liability') {
        const isIslamic = isIslamicFinancing(formData.financingType);
        await createLiability.mutateAsync({
          name: formData.name,
          type: 'loan',
          country: formData.country,
          currency: formData.currency,
          current_balance: parseFloat(formData.currentValue) || 0,
          original_amount: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          institution: formData.institution || null,
          notes: formData.notes || null,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
          financing_type: formData.financingType,
          is_shariah_compliant: isIslamic,
          shariah_advisor: formData.shariahAdvisor || null,
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : null,
          profit_margin: formData.profitMargin ? parseFloat(formData.profitMargin) : null,
          monthly_rental: formData.monthlyRental ? parseFloat(formData.monthlyRental) : null,
          residual_value: formData.residualValue ? parseFloat(formData.residualValue) : null,
          bank_ownership_percentage: formData.bankOwnershipPercentage ? parseFloat(formData.bankOwnershipPercentage) : null,
        });
      } else if (category === 'collections') {
        await createCollection.mutateAsync({
          id: tempAssetId,
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          current_value: parseFloat(formData.currentValue) || 0,
          purchase_value: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          notes: formData.notes || null,
          image_url: imageUrl,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
        });
      } else {
        const isOffPlan = selectedType === 'real-estate' && ['off_plan', 'under_construction'].includes(formData.propertyStatus);
        await createAsset.mutateAsync({
          id: tempAssetId,
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          // For off-plan: current_value = amount_paid
          current_value: isOffPlan 
            ? (parseFloat(formData.amountPaid) || 0)
            : (parseFloat(formData.currentValue) || 0),
          purchase_value: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          ownership_percentage: parseFloat(formData.ownershipPercent) || 100,
          ticker: formData.cryptoToken || null,
          quantity: formData.cryptoQuantity ? parseFloat(formData.cryptoQuantity) : null,
          institution: formData.institution || null,
          platform: formData.cryptoPlatform || null,
          reference_balance: formData.referenceBalance ? parseFloat(formData.referenceBalance) : null,
          reference_date: formData.referenceDate ? format(formData.referenceDate, 'yyyy-MM-dd') : null,
          notes: formData.notes || null,
          image_url: imageUrl,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
          certainty: formData.certainty,
          // Off-plan fields
          property_status: selectedType === 'real-estate' ? formData.propertyStatus : null,
          project_name: formData.projectName || null,
          developer: formData.developer || null,
          unit_number: formData.unitNumber || null,
          total_price: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
          amount_paid: formData.amountPaid ? parseFloat(formData.amountPaid) : null,
          expected_delivery: formData.expectedDelivery ? format(formData.expectedDelivery, 'yyyy-MM-dd') : null,
          // Shariah compliance for investments
          is_shariah_compliant: selectedType === 'investment' ? formData.isShariahCompliant : false,
          shariah_certification: formData.shariahCertification || null,
          // UK tenure fields
          tenure_type: selectedType === 'real-estate' ? formData.tenureType : null,
          lease_end_date: formData.leaseEndDate ? format(formData.leaseEndDate, 'yyyy-MM-dd') : null,
          // Liquidity status
          liquidity_status: formData.liquidityStatus,
          // Location fields for real estate
          address: selectedType === 'real-estate' ? (formData.address || null) : null,
          latitude: selectedType === 'real-estate' ? formData.latitude : null,
          longitude: selectedType === 'real-estate' ? formData.longitude : null,
          // Property details for real estate
          property_type: selectedType === 'real-estate' ? (formData.propertyType || null) : null,
          rooms: selectedType === 'real-estate' && formData.rooms ? parseInt(formData.rooms) : null,
          size_sqm: selectedType === 'real-estate' && formData.sizeSqm ? parseFloat(formData.sizeSqm) : null,
        });
      }

      toast({
        title: "Asset added",
        description: `${formData.name} has been added to your portfolio.`,
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add asset. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'form') setStep('type');
    else if (step === 'type') setStep('category');
  };

  const types = category === 'wealth' ? wealthTypes : collectionTypes;

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-3xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Add Asset</h1>
          <p className="text-muted-foreground">Add a new asset to your wealth portfolio.</p>
        </header>

        {/* Step 1: Category */}
        {step === 'category' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <button
              onClick={() => handleCategorySelect('wealth')}
              className="asset-card text-left hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Briefcase size={24} strokeWidth={1.5} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">Wealth</h3>
                  <p className="text-sm text-muted-foreground">Core financial assets</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Real estate, investments, bank accounts, digital assets, and business equity.
              </p>
            </button>

            <button
              onClick={() => handleCategorySelect('collections')}
              className="asset-card text-left hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Gem size={24} strokeWidth={1.5} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">Collections</h3>
                  <p className="text-sm text-muted-foreground">Alternative assets</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Watches, vehicles, art, jewelry, wine, and LP positions.
              </p>
            </button>
          </div>
        )}

        {/* Step 2: Type */}
        {step === 'type' && (
          <div className="animate-fade-in">
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              ← Back to categories
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="asset-card text-left hover:border-primary transition-colors"
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                    <type.icon size={20} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Form */}
        {step === 'form' && (
          <div className="animate-fade-in">
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              ← Back to asset types
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload for physical assets / collections / business / crypto (NOT real-estate AI) */}
              {supportsImage && selectedType !== 'liability' && (
                <div className="space-y-2">
                  <Label>{selectedType === 'real-estate' ? 'Photo (optional)' : 'Image (optional)'}</Label>
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    assetId={tempAssetId}
                    onGenerateAI={() => setShowAIDialog(true)}
                    hideAIButton={selectedType === 'real-estate'}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Dubai Marina Apartment"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    placeholder="Select country"
                  />
                </div>

                {/* Address field for Real Estate */}
                {selectedType === 'real-estate' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Address (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
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
                            setFormData({ 
                              ...formData, 
                              latitude: result.lat, 
                              longitude: result.lon 
                            });
                            toast({
                              title: "Location found",
                              description: "Coordinates have been set for map display.",
                            });
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Location not found",
                              description: "Could not geocode this address. Try a more specific address.",
                            });
                          }
                        }}
                        disabled={isGeocoding || !formData.address.trim()}
                        title="Geocode address"
                      >
                        {isGeocoding ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      </Button>
                    </div>
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-muted-foreground">
                        📍 Coordinates set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                )}

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
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Certainty field */}
                {selectedType !== 'liability' && (
                  <div className="space-y-2">
                    <Label>Certainty</Label>
                    <CertaintySelect
                      value={formData.certainty}
                      onValueChange={(value: CertaintyLevel) => setFormData({ ...formData, certainty: value })}
                    />
                  </div>
                )}
                {selectedType === 'real-estate' && (
                  <div className="space-y-2">
                    <Label>Property Status</Label>
                    <Select 
                      value={formData.propertyStatus} 
                      onValueChange={(value) => setFormData({ ...formData, propertyStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owned">Owned</SelectItem>
                        <SelectItem value="off_plan">Off-Plan / VEFA</SelectItem>
                        <SelectItem value="under_construction">Under Construction</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="rented_out">Rented Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Property Type for Real Estate */}
                {selectedType === 'real-estate' && (
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select 
                      value={formData.propertyType} 
                      onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
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
                )}

                {/* Rooms & Size for Real Estate */}
                {selectedType === 'real-estate' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rooms">Rooms</Label>
                      <Input
                        id="rooms"
                        type="number"
                        min="0"
                        value={formData.rooms}
                        onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sizeSqm">Size (m²)</Label>
                      <Input
                        id="sizeSqm"
                        type="number"
                        min="0"
                        value={formData.sizeSqm}
                        onChange={(e) => setFormData({ ...formData, sizeSqm: e.target.value })}
                        placeholder="e.g., 120"
                      />
                    </div>
                  </div>
                )}

                {/* UK Tenure Type for Real Estate */}
                {selectedType === 'real-estate' && (
                  <div className="space-y-2">
                    <Label>Tenure Type</Label>
                    <Select 
                      value={formData.tenureType} 
                      onValueChange={(value) => setFormData({ ...formData, tenureType: value })}
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
                )}

                {/* Lease End Date for Leasehold properties */}
                {selectedType === 'real-estate' && formData.tenureType === 'leasehold' && (
                  <div className="space-y-2">
                    <Label>Lease End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.leaseEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.leaseEndDate ? format(formData.leaseEndDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.leaseEndDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, leaseEndDate: date || null })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {formData.leaseEndDate && (() => {
                      const yearsRemaining = Math.floor((formData.leaseEndDate.getTime() - new Date().getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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

                {/* Current Value - hidden for off-plan (auto-calculated) */}
                {!(selectedType === 'real-estate' && ['off_plan', 'under_construction'].includes(formData.propertyStatus)) && (
                  <div className="space-y-2">
                    <Label htmlFor="currentValue">
                      {selectedType === 'liability' ? 'Outstanding Balance' : 'Current Value'}
                    </Label>
                    <Input
                      id="currentValue"
                      type="number"
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                      placeholder="0"
                      required={!(selectedType === 'real-estate' && ['off_plan', 'under_construction'].includes(formData.propertyStatus))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Owner</Label>
                  <EntitySelect
                    value={formData.entityId === undefined ? defaultEntityId : formData.entityId}
                    onChange={(value) => setFormData({ ...formData, entityId: value })}
                    placeholder="Select owner"
                  />
                </div>

                {/* Off-Plan Fields */}
                {selectedType === 'real-estate' && ['off_plan', 'under_construction'].includes(formData.propertyStatus) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={formData.projectName}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        placeholder="e.g., Dubai Creek Harbour"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="developer">Developer</Label>
                      <Select 
                        value={formData.developer} 
                        onValueChange={(value) => setFormData({ ...formData, developer: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select developer" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Emaar Properties', 'Damac Properties', 'Sobha Realty', 'Nakheel', 'Meraas', 'Dubai Properties', 'Azizi Developments', 'Danube Properties', 'Ellington Properties', 'Select Group', 'Aldar', 'Imkan', 'Eagle Hills', 'Omniyat', 'Other'].map((dev) => (
                            <SelectItem key={dev} value={dev}>{dev}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitNumber">Unit Number</Label>
                      <Input
                        id="unitNumber"
                        value={formData.unitNumber}
                        onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                        placeholder="e.g., A-1805"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalPrice">Total Price</Label>
                      <Input
                        id="totalPrice"
                        type="number"
                        value={formData.totalPrice}
                        onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amountPaid">Amount Paid</Label>
                      <Input
                        id="amountPaid"
                        type="number"
                        value={formData.amountPaid}
                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Delivery</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.expectedDelivery && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expectedDelivery ? format(formData.expectedDelivery, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expectedDelivery || undefined}
                            onSelect={(date) => setFormData({ ...formData, expectedDelivery: date || null })}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {selectedType === 'crypto' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoToken">Token</Label>
                      <Select 
                        value={formData.cryptoToken} 
                        onValueChange={(value) => setFormData({ ...formData, cryptoToken: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA'].map((token) => (
                            <SelectItem key={token} value={token}>{token}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoQuantity">Quantity</Label>
                      <Input
                        id="cryptoQuantity"
                        type="number"
                        step="0.0001"
                        value={formData.cryptoQuantity}
                        onChange={(e) => setFormData({ ...formData, cryptoQuantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoPlatform">Platform</Label>
                      <Select 
                        value={formData.cryptoPlatform} 
                        onValueChange={(value) => setFormData({ ...formData, cryptoPlatform: value })}
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

                {selectedType === 'business' && (
                  <div className="space-y-2">
                    <Label htmlFor="ownershipPercent">Ownership %</Label>
                    <Input
                      id="ownershipPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.ownershipPercent}
                      onChange={(e) => setFormData({ ...formData, ownershipPercent: e.target.value })}
                    />
                  </div>
                )}

                {(selectedType === 'bank' || selectedType === 'investment' || selectedType === 'liability') && (
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g., Emirates NBD"
                    />
                  </div>
                )}

                {selectedType !== 'bank' && selectedType !== 'liability' && (
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price (optional)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                {selectedType === 'liability' && (
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Original Amount (optional)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                {/* Islamic Financing Section for Liabilities */}
                {selectedType === 'liability' && (
                  <>
                    <div className="col-span-2 space-y-2">
                      <Label>Financing Type</Label>
                      <Select 
                        value={formData.financingType} 
                        onValueChange={(value) => setFormData({ ...formData, financingType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredFinancingTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span>{type.label}</span>
                                <span className="text-xs text-muted-foreground">{type.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Show Shariah badge for Islamic types */}
                    {isIslamicFinancing(formData.financingType) && (
                      <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg bg-positive/10 border border-positive/20">
                        <Moon size={18} className="text-positive" />
                        <span className="text-sm text-positive font-medium">Shariah Compliant Financing</span>
                      </div>
                    )}

                    {/* Shariah Advisor field for Islamic financing */}
                    {isIslamicFinancing(formData.financingType) && (
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="shariahAdvisor">Shariah Advisor (optional)</Label>
                        <Input
                          id="shariahAdvisor"
                          value={formData.shariahAdvisor}
                          onChange={(e) => setFormData({ ...formData, shariahAdvisor: e.target.value })}
                          placeholder="e.g., Dubai Islamic Bank Shariah Board"
                        />
                      </div>
                    )}

                    {/* Murabaha specific fields */}
                    {formData.financingType === 'murabaha' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="costPrice">Cost Price</Label>
                          <Input
                            id="costPrice"
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                            placeholder="Original asset cost"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profitMargin">Profit Margin</Label>
                          <Input
                            id="profitMargin"
                            type="number"
                            value={formData.profitMargin}
                            onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })}
                            placeholder="Bank's markup"
                          />
                        </div>
                      </>
                    )}

                    {/* Ijara specific fields */}
                    {formData.financingType === 'ijara' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="monthlyRental">Monthly Rental</Label>
                          <Input
                            id="monthlyRental"
                            type="number"
                            value={formData.monthlyRental}
                            onChange={(e) => setFormData({ ...formData, monthlyRental: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="residualValue">Residual Value</Label>
                          <Input
                            id="residualValue"
                            type="number"
                            value={formData.residualValue}
                            onChange={(e) => setFormData({ ...formData, residualValue: e.target.value })}
                            placeholder="Transfer price at end"
                          />
                        </div>
                      </>
                    )}

                    {/* Diminishing Musharaka specific fields */}
                    {formData.financingType === 'diminishing_musharaka' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bankOwnershipPercentage">Bank Ownership %</Label>
                          <Input
                            id="bankOwnershipPercentage"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.bankOwnershipPercentage}
                            onChange={(e) => setFormData({ ...formData, bankOwnershipPercentage: e.target.value })}
                            placeholder="Current bank share"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monthlyRental">Monthly Payment</Label>
                          <Input
                            id="monthlyRental"
                            type="number"
                            value={formData.monthlyRental}
                            onChange={(e) => setFormData({ ...formData, monthlyRental: e.target.value })}
                            placeholder="Rent + buyout"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Shariah Compliance for Investments - only show if Islamic mode enabled */}
                {selectedType === 'investment' && showIslamic && (
                  <>
                    <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <Moon size={18} className={formData.isShariahCompliant ? 'text-positive' : 'text-muted-foreground'} />
                        <div>
                          <Label className="text-sm font-medium">Shariah Compliant</Label>
                          <p className="text-xs text-muted-foreground">Mark this investment as Shariah compliant</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isShariahCompliant}
                        onCheckedChange={(checked) => setFormData({ ...formData, isShariahCompliant: checked })}
                      />
                    </div>
                    {formData.isShariahCompliant && (
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="shariahCertification">Certification (optional)</Label>
                        <Input
                          id="shariahCertification"
                          value={formData.shariahCertification}
                          onChange={(e) => setFormData({ ...formData, shariahCertification: e.target.value })}
                          placeholder="e.g., AAOIFI Compliant"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedType === 'bank' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="referenceBalance">Solde de référence (optionnel)</Label>
                      <Input
                        id="referenceBalance"
                        type="number"
                        value={formData.referenceBalance}
                        onChange={(e) => setFormData({ ...formData, referenceBalance: e.target.value })}
                        placeholder="0"
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
                              !formData.referenceDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.referenceDate ? format(formData.referenceDate, "PPP") : "Sélectionner une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.referenceDate || undefined}
                            onSelect={(date) => setFormData({ ...formData, referenceDate: date || null })}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>

              {/* Liquidity Status - Advanced Section */}
              {selectedType !== 'liability' && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label>Liquidity Status</Label>
                  <Select 
                    value={formData.liquidityStatus} 
                    onValueChange={(value) => setFormData({ ...formData, liquidityStatus: value })}
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
                  {formData.liquidityStatus !== 'liquid' && (
                    <p className="text-xs text-muted-foreground">
                      This asset will be marked with a liquidity warning badge.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Asset'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* AI Image Generation Dialog */}
      <AIImageDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        assetType={selectedType || 'other'}
        name={formData.name}
        country={formData.country}
        onImageGenerated={setImageUrl}
      />
    </AppLayout>
  );
};

export default AddAssetPage;
