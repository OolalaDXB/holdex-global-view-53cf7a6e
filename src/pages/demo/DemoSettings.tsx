import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/contexts/DemoContext';
import { FavoriteCitiesSelect, SimplifiedCity } from '@/components/settings/FavoriteCitiesSelect';
import { DashboardWidgetsSelect } from '@/components/settings/DashboardWidgetsSelect';
import { NewsSourcesSelect } from '@/components/settings/NewsSourcesSelect';

type City = SimplifiedCity;

const FISCAL_YEAR_OPTIONS = [
  { value: '01-01', label: 'January 1 (Default)' },
  { value: '04-01', label: 'April 1 (UK)' },
  { value: '04-06', label: 'April 6 (UK Tax)' },
  { value: '07-01', label: 'July 1 (Australia)' },
];

const AVAILABLE_CURRENCIES = ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB', 'JPY', 'CNY', 'INR', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'SGD', 'HKD', 'AUD', 'CAD'];

const DemoSettings = () => {
  const { toast } = useToast();
  const { profile, updateProfile } = useDemo();

  const [fullName, setFullName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [secondaryCurrency1, setSecondaryCurrency1] = useState('USD');
  const [secondaryCurrency2, setSecondaryCurrency2] = useState('AED');
  const [darkMode, setDarkMode] = useState(true);
  const [complianceMode, setComplianceMode] = useState('none');
  
  // Income fields for DTI
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [monthlyIncomeCurrency, setMonthlyIncomeCurrency] = useState('EUR');
  
  // Preference states
  const [favoriteCities, setFavoriteCities] = useState<City[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([]);
  const [blurAmounts, setBlurAmounts] = useState(false);
  const [fiscalYearStart, setFiscalYearStart] = useState('01-01');
  const [newsSources, setNewsSources] = useState<string[]>(['bloomberg', 'reuters']);
  const [areaUnit, setAreaUnit] = useState<'sqm' | 'sqft'>('sqm');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBaseCurrency(profile.base_currency || 'EUR');
      setSecondaryCurrency1(profile.secondary_currency_1 || 'USD');
      setSecondaryCurrency2(profile.secondary_currency_2 || 'AED');
      setDarkMode(profile.dark_mode ?? true);
      setComplianceMode(profile.compliance_mode || 'none');
      setMonthlyIncome(profile.monthly_income?.toString() || '');
      setMonthlyIncomeCurrency(profile.monthly_income_currency || 'EUR');
      setFavoriteCities(profile.favorite_cities || []);
      setDashboardWidgets(profile.dashboard_widgets || []);
      setBlurAmounts(profile.blur_amounts || false);
      setFiscalYearStart(profile.fiscal_year_start || '01-01');
      setAreaUnit(profile.area_unit || 'sqm');
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      full_name: fullName,
      base_currency: baseCurrency,
      secondary_currency_1: secondaryCurrency1,
      secondary_currency_2: secondaryCurrency2,
      dark_mode: darkMode,
      compliance_mode: complianceMode,
      monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
      monthly_income_currency: monthlyIncomeCurrency,
      favorite_cities: favoriteCities,
      dashboard_widgets: dashboardWidgets,
      blur_amounts: blurAmounts,
      fiscal_year_start: fiscalYearStart,
      area_unit: areaUnit,
    });
    toast({
      title: "Settings saved",
      description: "Your demo preferences have been updated.",
    });
  };

  return (
    <AppLayout isDemo>
      <div className="p-8 lg:p-12 max-w-2xl">
        {/* Demo banner */}
        <div className="mb-6 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md">
          <p className="text-sm text-primary">Demo Mode — Changes are stored locally</p>
        </div>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your demo preferences.</p>
        </header>

        <div className="space-y-8">
          {/* Profile Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Profile</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Demo account email.</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Monthly Income Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Monthly Income</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your total monthly income for debt-to-income ratio calculation. Rental income from properties is added automatically.
            </p>
            <div className="flex gap-4">
              <div className="flex-1 max-w-xs space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="incomeCurrency">Currency</Label>
                <Select value={monthlyIncomeCurrency} onValueChange={setMonthlyIncomeCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Currency Preferences</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred currencies for the dashboard switcher.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">Base Currency</Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Primary display currency</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary1">Secondary Currency 1</Label>
                <Select value={secondaryCurrency1} onValueChange={setSecondaryCurrency1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary2">Secondary Currency 2</Label>
                <Select value={secondaryCurrency2} onValueChange={setSecondaryCurrency2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Favorite Cities Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Favorite Cities</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select cities to display world clocks on your dashboard.
            </p>
            <FavoriteCitiesSelect
              value={favoriteCities}
              onChange={setFavoriteCities}
              maxCities={5}
            />
          </section>

          <Separator />

          {/* Dashboard Widgets Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Dashboard Widgets</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which widgets to display on your dashboard.
            </p>
            <DashboardWidgetsSelect
              value={dashboardWidgets}
              onChange={setDashboardWidgets}
            />
          </section>

          <Separator />

          {/* News Sources Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">News Sources</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select which news feeds to display in the ticker (when enabled).
            </p>
            <NewsSourcesSelect
              value={newsSources}
              onChange={setNewsSources}
            />
          </section>

          <Separator />

          {/* Display Preferences Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Display</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Use dark theme for the interface.</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="areaUnit">Property Size in Square Feet</Label>
                  <p className="text-xs text-muted-foreground">Display property sizes in sq ft instead of m².</p>
                </div>
                <Switch
                  id="areaUnit"
                  checked={areaUnit === 'sqft'}
                  onCheckedChange={(checked) => setAreaUnit(checked ? 'sqft' : 'sqm')}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Privacy Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="blurAmounts">Blur Amounts</Label>
                  <p className="text-xs text-muted-foreground">Hide monetary values with ••••• for privacy.</p>
                </div>
                <Switch
                  id="blurAmounts"
                  checked={blurAmounts}
                  onCheckedChange={setBlurAmounts}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Fiscal Year Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Fiscal Year</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set your fiscal year start for charts and annual calculations.
            </p>
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year Starts</Label>
              <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Compliance Mode Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Ethical & Compliant Finance</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enable features for religious and ethical finance tracking.
            </p>
            <div className="space-y-2">
              <Label htmlFor="complianceMode">Compliance Mode</Label>
              <Select value={complianceMode} onValueChange={setComplianceMode}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (default)</SelectItem>
                  <SelectItem value="islamic">Islamic Finance</SelectItem>
                  <SelectItem value="jewish">Jewish Finance (Heter Iska)</SelectItem>
                  <SelectItem value="hindu">Hindu Undivided Family</SelectItem>
                  <SelectItem value="all">All Compliance Modes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Enables specialized fields and entity types for compliant financial tracking.
              </p>
            </div>
          </section>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DemoSettings;
