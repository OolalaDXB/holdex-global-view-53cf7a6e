import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, Profile, FavoriteCity } from '@/hooks/useProfile';
import { useSharedAccess, useInvitePartner, useRevokeAccess, useReceivedInvitations, useRespondToInvitation, ReceivedInvitation } from '@/hooks/useSharedAccess';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { FavoriteCitiesSelect } from '@/components/settings/FavoriteCitiesSelect';
import { DashboardWidgetsSelect } from '@/components/settings/DashboardWidgetsSelect';
import { NewsSourcesSelect } from '@/components/settings/NewsSourcesSelect';
import { X, Check, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const FISCAL_YEAR_OPTIONS = [
  { value: '01-01', label: 'January 1 (Default)' },
  { value: '04-01', label: 'April 1 (UK)' },
  { value: '04-06', label: 'April 6 (UK Tax)' },
  { value: '07-01', label: 'July 1 (Australia)' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: sharedAccess = [] } = useSharedAccess();
  const { data: receivedInvitations = [] } = useReceivedInvitations();
  const invitePartner = useInvitePartner();
  const revokeAccess = useRevokeAccess();
  const respondToInvitation = useRespondToInvitation();
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: exchangeRates } = useExchangeRates();

  const [fullName, setFullName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [secondaryCurrency1, setSecondaryCurrency1] = useState('USD');
  const [secondaryCurrency2, setSecondaryCurrency2] = useState('AED');
  const [darkMode, setDarkMode] = useState(true);
  const [complianceMode, setComplianceMode] = useState('none');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Income fields for DTI
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [monthlyIncomeCurrency, setMonthlyIncomeCurrency] = useState('EUR');
  
  // New preference states
  const [favoriteCities, setFavoriteCities] = useState<FavoriteCity[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([]);
  const [blurAmounts, setBlurAmounts] = useState(false);
  const [fiscalYearStart, setFiscalYearStart] = useState('01-01');
  const [newsSources, setNewsSources] = useState<string[]>(['bloomberg', 'reuters']);
  const [areaUnit, setAreaUnit] = useState<'sqm' | 'sqft'>('sqm');

  // Get all available currencies from exchange rates API
  const availableCurrencies = exchangeRates?.rates 
    ? Object.keys(exchangeRates.rates).sort() 
    : ['EUR', 'USD', 'AED', 'GBP', 'CHF', 'RUB'];

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBaseCurrency(profile.base_currency || 'EUR');
      setSecondaryCurrency1(profile.secondary_currency_1 || 'USD');
      setSecondaryCurrency2(profile.secondary_currency_2 || 'AED');
      setDarkMode(profile.dark_mode ?? true);
      setComplianceMode(profile.compliance_mode || 'none');
      
      // Income fields
      setMonthlyIncome(profile.monthly_income?.toString() || '');
      setMonthlyIncomeCurrency(profile.monthly_income_currency || 'EUR');
      
      // New preferences
      setFavoriteCities(profile.favorite_cities || []);
      setDashboardWidgets(profile.dashboard_widgets || []);
      setBlurAmounts(profile.blur_amounts || false);
      setFiscalYearStart(profile.fiscal_year_start || '01-01');
      setNewsSources(profile.news_sources || ['bloomberg', 'reuters']);
      setAreaUnit((profile.area_unit as 'sqm' | 'sqft') || 'sqm');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
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
        news_sources: newsSources,
        area_unit: areaUnit,
      } as any);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await invitePartner.mutateAsync(inviteEmail.trim());
      toast({
        title: "Invitation sent",
        description: `${inviteEmail} has been invited to view your portfolio.`,
      });
      setInviteEmail('');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast({
          variant: "destructive",
          title: "Already invited",
          description: "This email has already been invited.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send invitation. Please try again.",
        });
      }
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    try {
      await revokeAccess.mutateAsync(id);
      toast({
        title: "Access revoked",
        description: `${email} no longer has access to your portfolio.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke access. Please try again.",
      });
    }
  };

  const handleRespondToInvitation = async (id: string, status: 'accepted' | 'declined', ownerEmail?: string) => {
    try {
      await respondToInvitation.mutateAsync({ id, status });
      toast({
        title: status === 'accepted' ? "Invitation accepted" : "Invitation declined",
        description: status === 'accepted' 
          ? "You can now view this portfolio." 
          : "The invitation has been declined.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to respond to invitation. Please try again.",
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Name', 'Country', 'Currency', 'Value'];
    const rows: string[][] = [];

    assets.forEach(a => {
      rows.push(['Asset', a.name, a.country, a.currency, a.current_value.toString()]);
    });
    collections.forEach(c => {
      rows.push(['Collection', c.name, c.country, c.currency, c.current_value.toString()]);
    });
    liabilities.forEach(l => {
      rows.push(['Liability', l.name, l.country, l.currency, (-l.current_balance).toString()]);
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holdex-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Your data has been downloaded as a CSV file.",
    });
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="p-8 lg:p-12 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-2xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
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
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
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
                    {availableCurrencies.map((currency) => (
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
                    {availableCurrencies.map((currency) => (
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
                    {availableCurrencies.map((currency) => (
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
                    {availableCurrencies.map((currency) => (
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

          {/* Ethical & Compliant Finance Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-2">Ethical & Compliant Finance</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enable specialized features for religious or ethical finance structures.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="complianceMode"
                  value="none"
                  checked={complianceMode === 'none'}
                  onChange={(e) => setComplianceMode(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm text-foreground">None</span>
                  <span className="text-xs text-muted-foreground ml-2">(default)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="complianceMode"
                  value="islamic"
                  checked={complianceMode === 'islamic'}
                  onChange={(e) => setComplianceMode(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm text-foreground">Islamic Finance</span>
                  <span className="text-xs text-muted-foreground ml-2">(Ijara, Murabaha, Musharaka, Waqf)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="complianceMode"
                  value="jewish"
                  checked={complianceMode === 'jewish'}
                  onChange={(e) => setComplianceMode(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm text-foreground">Jewish Finance</span>
                  <span className="text-xs text-muted-foreground ml-2">(Heter Iska)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="complianceMode"
                  value="hindu"
                  checked={complianceMode === 'hindu'}
                  onChange={(e) => setComplianceMode(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm text-foreground">Hindu Family</span>
                  <span className="text-xs text-muted-foreground ml-2">(HUF structures)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="complianceMode"
                  value="all"
                  checked={complianceMode === 'all'}
                  onChange={(e) => setComplianceMode(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm text-foreground">All compliant options</span>
                </div>
              </label>
            </div>
          </section>

          <Separator />

          {/* Received Invitations Section */}
          {receivedInvitations.filter(inv => inv.status === 'pending').length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-medium text-foreground mb-4">Pending Invitations</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You have been invited to view someone else's portfolio.
              </p>
              <div className="space-y-2">
                {receivedInvitations.filter(inv => inv.status === 'pending').map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md">
                    <div>
                      <span className="text-sm text-foreground">Portfolio invitation</span>
                      <span className="text-xs text-muted-foreground ml-2">(pending)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                        disabled={respondToInvitation.isPending}
                        className="h-7 px-2"
                      >
                        <Check size={14} className="mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                        disabled={respondToInvitation.isPending}
                        className="h-7 px-2 text-muted-foreground hover:text-destructive"
                      >
                        <XCircle size={14} className="mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {receivedInvitations.filter(inv => inv.status === 'pending').length > 0 && <Separator />}

          {/* Portfolios You Have Access To */}
          {(receivedInvitations as ReceivedInvitation[]).filter(inv => inv.status === 'accepted').length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-medium text-foreground mb-4">Shared Portfolios</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Portfolios you have read-only access to.
              </p>
              <div className="space-y-2">
                {(receivedInvitations as ReceivedInvitation[]).filter(inv => inv.status === 'accepted').map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {invitation.owner_profile?.full_name || invitation.owner_profile?.email || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">(read-only)</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/?view=${invitation.owner_id}`)}
                      className="h-7 px-3"
                    >
                      View Portfolio
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(receivedInvitations as ReceivedInvitation[]).filter(inv => inv.status === 'accepted').length > 0 && <Separator />}

          {/* Sharing Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Sharing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Invite a partner to view your portfolio. They will have read-only access.
            </p>
            
            {sharedAccess.length > 0 && (
              <div className="mb-4 space-y-2">
                {sharedAccess.map((share) => (
                  <div key={share.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md">
                    <div>
                      <span className="text-sm text-foreground">{share.shared_with_email}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">({share.status})</span>
                    </div>
                    <button
                      onClick={() => handleRevoke(share.id, share.shared_with_email)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input 
                placeholder="partner@example.com" 
                className="max-w-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
              />
              <Button 
                variant="outline" 
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || invitePartner.isPending}
              >
                {invitePartner.isPending ? 'Inviting...' : 'Invite'}
              </Button>
            </div>
          </section>

          <Separator />

          {/* Data Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Data</h2>
            <div className="space-y-4">
              <div>
                <Button variant="outline" onClick={handleExportCSV}>
                  Export to CSV
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Download all your data as a spreadsheet.</p>
              </div>
              <div>
                <Button variant="destructive" className="bg-dusty-rose hover:bg-dusty-rose/90">
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Permanently delete your account and all data.</p>
              </div>
            </div>
          </section>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
