import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Building2, Landmark, TrendingUp, Bitcoin, Briefcase, TrendingDown, Watch, Car, Palette, Gem, Wine, BarChart3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/contexts/DemoContext';

type Step = 'category' | 'type' | 'form';
type Category = 'wealth' | 'collections';

const wealthTypes = [
  { id: 'real-estate', label: 'Real Estate', icon: Building2, description: 'Properties and land' },
  { id: 'bank', label: 'Bank Account', icon: Landmark, description: 'Cash and deposits' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, description: 'Stocks, ETFs, bonds' },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin, description: 'Digital assets' },
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

const currencies = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'GEL'];
const countries = ['UAE', 'Portugal', 'France', 'Germany', 'Switzerland', 'USA', 'UK', 'Botswana', 'Russia', 'Global', 'Georgia', 'Netherlands'];

const DemoAddAssetPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addAsset, addCollection, addLiability } = useDemo();
  
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'EUR',
    currentValue: '',
    purchasePrice: '',
    ownershipPercent: '100',
    cryptoToken: '',
    cryptoQuantity: '',
    notes: '',
    institution: '',
  });

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
          notes: formData.notes || null,
          rental_income: null,
        });
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
            Mode démo — Les ajouts sont temporaires
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
                Real estate, investments, bank accounts, crypto, and business equity.
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
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">
                    {selectedType === 'liability' ? 'Original Amount (optional)' : 'Purchase Price (optional)'}
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
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
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DemoAddAssetPage;
