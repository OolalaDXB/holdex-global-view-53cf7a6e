import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { useToast } from '@/hooks/use-toast';
import { useCreateAsset } from '@/hooks/useAssets';
import { useCreateCollection } from '@/hooks/useCollections';
import { useDefaultEntity } from '@/components/entities/EntitySelect';
import { useCurrencyList } from '@/hooks/useCurrencyList';
import { cn } from '@/lib/utils';
import { 
  Gem, 
  Building2, 
  Landmark, 
  TrendingUp, 
  Bitcoin, 
  Briefcase,
  Watch, 
  Car, 
  Palette,
  Wine,
  Disc3,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Step = 'welcome' | 'category' | 'type' | 'details' | 'success';
type Category = 'wealth' | 'collections';

interface OnboardingWizardProps {
  userName?: string;
}

const wealthTypes = [
  { id: 'real-estate', label: 'Real Estate', icon: Building2, description: 'Properties and land' },
  { id: 'bank', label: 'Bank Account', icon: Landmark, description: 'Cash and deposits' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, description: 'Stocks, ETFs, bonds' },
  { id: 'crypto', label: 'Digital Assets', icon: Bitcoin, description: 'Crypto and tokens' },
  { id: 'business', label: 'Business Equity', icon: Briefcase, description: 'Company ownership' },
];

const collectionTypes = [
  { id: 'watch', label: 'Watch', icon: Watch, description: 'Timepieces' },
  { id: 'vehicle', label: 'Vehicle', icon: Car, description: 'Cars and motorcycles' },
  { id: 'art', label: 'Art', icon: Palette, description: 'Paintings and sculptures' },
  { id: 'wine', label: 'Wine', icon: Wine, description: 'Wine collection' },
  { id: 'vinyl', label: 'Vinyls', icon: Disc3, description: 'Records and LPs' },
];

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createAsset = useCreateAsset();
  const createCollection = useCreateCollection();
  const defaultEntityId = useDefaultEntity();
  const currencies = useCurrencyList();
  
  const [step, setStep] = useState<Step>('welcome');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: 'EUR',
    currentValue: '',
  });

  const displayName = userName || 'there';

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setStep('type');
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !formData.country || !formData.name || !formData.currentValue) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (category === 'collections') {
        await createCollection.mutateAsync({
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          current_value: parseFloat(formData.currentValue) || 0,
          entity_id: defaultEntityId,
        });
      } else {
        await createAsset.mutateAsync({
          name: formData.name,
          type: selectedType,
          country: formData.country,
          currency: formData.currency,
          current_value: parseFloat(formData.currentValue) || 0,
          entity_id: defaultEntityId,
        });
      }
      
      setStep('success');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create asset. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'type') setStep('category');
    else if (step === 'details') setStep('type');
    else if (step === 'category') setStep('welcome');
  };

  const getStepNumber = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'category': return 1;
      case 'type': return 2;
      case 'details': return 3;
      case 'success': return 4;
    }
  };

  const totalSteps = 4;
  const currentStep = getStepNumber();

  return (
    <div className="p-8 lg:p-12 max-w-3xl mx-auto">
      {/* Progress Bar */}
      {step !== 'welcome' && step !== 'success' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Step {currentStep} of {totalSteps - 1}</span>
            <button 
              onClick={goBack} 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Welcome Step */}
      {step === 'welcome' && (
        <div className="text-center">
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Welcome
            </p>
            <h1 className="font-serif text-4xl font-medium text-foreground">
              {displayName}
            </h1>
          </div>

          <Card className="border border-border bg-card p-8 md:p-12 mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Gem className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
              Welcome to HOLDEX
            </h2>
            
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your wealth management dashboard is ready. Let us guide you through adding your first asset in just a few steps.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => setStep('category')} className="gap-2">
                <Sparkles size={16} />
                Start Setup
                <ArrowRight size={16} />
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/demo">
                  <Eye size={16} />
                  View Demo First
                </Link>
              </Button>
            </div>
          </Card>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border bg-card p-6 text-left">
              <div className="mb-4">
                <TrendingUp className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-foreground mb-1">Track Assets</h3>
              <p className="text-sm text-muted-foreground">
                Real estate, investments, crypto
              </p>
            </Card>

            <Card className="border border-border bg-card p-6 text-left">
              <div className="mb-4">
                <TrendingUp className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-foreground mb-1">Multi-Currency</h3>
              <p className="text-sm text-muted-foreground">
                Live exchange rates
              </p>
            </Card>

            <Card className="border border-border bg-card p-6 text-left">
              <div className="mb-4">
                <Gem className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-foreground mb-1">Collections</h3>
              <p className="text-sm text-muted-foreground">
                Watches, cars, art, wine
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Category Step */}
      {step === 'category' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
              What would you like to add?
            </h2>
            <p className="text-muted-foreground">
              Choose a category to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleCategorySelect('wealth')}
              className="group p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                Wealth Assets
              </h3>
              <p className="text-sm text-muted-foreground">
                Real estate, bank accounts, investments, crypto, business equity
              </p>
            </button>

            <button
              onClick={() => handleCategorySelect('collections')}
              className="group p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Gem className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                Collections
              </h3>
              <p className="text-sm text-muted-foreground">
                Watches, vehicles, art, jewelry, wine, vinyls
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Type Step */}
      {step === 'type' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
              Select asset type
            </h2>
            <p className="text-muted-foreground">
              Choose the type of {category === 'wealth' ? 'asset' : 'collection'} you want to add
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(category === 'wealth' ? wealthTypes : collectionTypes).map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="group p-5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <type.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {type.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Details Step */}
      {step === 'details' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
              Add details
            </h2>
            <p className="text-muted-foreground">
              Enter the basic information for your {selectedType?.replace('-', ' ')}
            </p>
          </div>

          <Card className="border border-border bg-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={selectedType === 'real-estate' ? 'e.g. Dubai Marina Apartment' : 'e.g. Main Savings Account'}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <CountrySelect
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Current Value *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? 'Creating...' : 'Create Asset'}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" strokeWidth={2} />
            </div>
          </div>
          
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
            Your first asset is ready!
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Congratulations! You have successfully added your first asset to HOLDEX. Continue adding more assets to build your complete wealth picture.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate('/')} className="gap-2">
              View Dashboard
              <ArrowRight size={16} />
            </Button>
            <Button asChild variant="outline">
              <Link to="/add">
                Add Another Asset
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
