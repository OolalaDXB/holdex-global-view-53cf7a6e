import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, TrendingDown, Watch, Car, Palette, Gem, Wine, BarChart3, Info, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { ImageUpload } from '@/components/ui/image-upload';
import { AIImageDialog } from '@/components/ui/ai-image-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CertaintySelect } from '@/components/ui/certainty-select';
import { getDefaultCertainty } from '@/lib/certainty';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/contexts/DemoContext';
import { getFilteredFinancingTypes, isIslamicFinancing } from '@/hooks/useLiabilities';
import { useDemoComplianceMode } from '@/hooks/useComplianceMode';
import { DemoEntitySelect, useDemoDefaultEntity } from '@/components/demo/DemoEntitySelect';
import { useDemoCurrencyList } from '@/hooks/useCurrencyList';

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

const DemoAddAssetPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addAsset, addCollection, addLiability, profile } = useDemo();
  const defaultEntityId = useDemoDefaultEntity();
  const { showIslamic, showJewish } = useDemoComplianceMode();
  const currencies = useDemoCurrencyList(profile);
  
  // Get filtered financing types based on compliance mode
  const filteredFinancingTypes = getFilteredFinancingTypes(showIslamic, showJewish);
  
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [tempAssetId] = useState(() => `temp-${Date.now()}`);

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
    image_url: null as string | null,
    entityId: undefined as string | null | undefined, // Will be set to default on mount
    certainty: 'certain',
    // Real estate address
    address: '',
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
  });

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setStep('type');
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    // Auto-suggest certainty based on type
    const suggestedCertainty = getDefaultCertainty(type);
    setFormData(prev => ({ ...prev, certainty: suggestedCertainty }));
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !formData.country) return;
    
    setIsSubmitting(true);

    try {
      if (selectedType === 'liability') {
        const isIslamic = isIslamicFinancing(formData.financingType);
        addLiability({
          name: formData.name,
          type: 'loan',
          country: formData.country,
          currency: formData.currency,
          current_balance: parseFloat(formData.currentValue) || 0,
          original_amount: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          institution: formData.institution || null,
          notes: formData.notes || null,
          interest_rate: null,
          monthly_payment: null,
          start_date: null,
          end_date: null,
          linked_asset_id: null,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
          financing_type: formData.financingType,
          is_shariah_compliant: isIslamic,
          shariah_advisor: formData.shariahAdvisor || null,
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : null,
          profit_margin: formData.profitMargin ? parseFloat(formData.profitMargin) : null,
          monthly_rental: formData.monthlyRental ? parseFloat(formData.monthlyRental) : null,
          residual_value: formData.residualValue ? parseFloat(formData.residualValue) : null,
          bank_ownership_percentage: formData.bankOwnershipPercentage ? parseFloat(formData.bankOwnershipPercentage) : null,
          certainty: formData.certainty,
        });
      } else if (category === 'collections') {
        addCollection({
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          current_value: parseFloat(formData.currentValue) || 0,
          purchase_value: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          purchase_date: null,
          notes: formData.notes || null,
          brand: null,
          model: null,
          year: null,
          description: null,
          fund_name: null,
          commitment_amount: null,
          called_amount: null,
          distribution_status: null,
          image_url: formData.image_url,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
          acquisition_type: 'purchase',
          acquisition_from: null,
          certainty: formData.certainty,
        });
      } else {
        addAsset({
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          current_value: parseFloat(formData.currentValue) || 0,
          purchase_value: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          purchase_date: null,
          ownership_percentage: parseFloat(formData.ownershipPercent) || 100,
          ticker: formData.cryptoToken || null,
          quantity: formData.cryptoQuantity ? parseFloat(formData.cryptoQuantity) : null,
          institution: formData.institution || null,
          platform: formData.cryptoPlatform || null,
          reference_balance: null,
          reference_date: null,
          notes: formData.notes || null,
          rental_income: null,
          image_url: formData.image_url,
          entity_id: formData.entityId === undefined ? defaultEntityId : formData.entityId,
          acquisition_type: 'purchase',
          acquisition_from: null,
          property_status: null,
          total_price: null,
          amount_paid: null,
          expected_delivery: null,
          developer: null,
          unit_number: null,
          project_name: null,
          is_shariah_compliant: selectedType === 'investment' ? formData.isShariahCompliant : false,
          shariah_certification: formData.shariahCertification || null,
          address: formData.address || null,
          certainty: formData.certainty,
        } as any);
      }

      toast({
        title: "Asset added",
        description: `${formData.name} has been added to your demo portfolio.`,
      });
      navigate('/demo');
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
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-3xl">
        {/* Demo Banner */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
          <Info size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            Demo mode — Additions are temporary
          </span>
          <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
        </div>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Add Asset</h1>
          <p className="text-muted-foreground">Add a new asset to your demo portfolio.</p>
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
              {/* Image Upload */}
              {selectedType !== 'liability' && (
                <div className="space-y-2">
                  <Label>Image (optional)</Label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Owner</Label>
                  <DemoEntitySelect
                    value={formData.entityId === undefined ? defaultEntityId : formData.entityId}
                    onChange={(value) => setFormData({ ...formData, entityId: value })}
                    placeholder="Select owner"
                  />
                </div>

                <CertaintySelect
                  value={formData.certainty}
                  onValueChange={(value) => setFormData({ ...formData, certainty: value })}
                  showLabel={true}
                />

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

                {selectedType === 'real-estate' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Address (optional)</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., 123 Marina Walk, Dubai Marina"
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
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Asset'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/demo')}>
                  Cancel
                </Button>
              </div>
            </form>

            <AIImageDialog
              open={showAIDialog}
              onOpenChange={setShowAIDialog}
              assetType={selectedType || ''}
              name={formData.name}
              brand={formData.institution}
              country={formData.country}
              notes={formData.notes}
              onImageGenerated={(url) => setFormData({ ...formData, image_url: url })}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DemoAddAssetPage;
