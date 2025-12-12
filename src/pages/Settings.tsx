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
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useSharedAccess, useInvitePartner, useRevokeAccess } from '@/hooks/useSharedAccess';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { X } from 'lucide-react';

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: sharedAccess = [] } = useSharedAccess();
  const invitePartner = useInvitePartner();
  const revokeAccess = useRevokeAccess();
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
      });
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

          {/* Currency Preferences Section */}
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

          {/* Display Preferences Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Display</h2>
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
