import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    name: 'Alexander Voronov',
    email: 'alexander@example.com',
    baseCurrency: 'EUR',
    darkMode: true,
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Preferences Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Preferences</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">Base Currency</Label>
                <Select 
                  value={settings.baseCurrency} 
                  onValueChange={(value) => setSettings({ ...settings, baseCurrency: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['EUR', 'USD', 'AED', 'GBP', 'CHF'].map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">All values will be converted to this currency.</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Use dark theme for the interface.</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Sharing Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Sharing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Invite a partner to view your portfolio. They will have read-only access.
            </p>
            <div className="flex gap-2">
              <Input placeholder="partner@example.com" className="max-w-sm" />
              <Button variant="outline">Invite</Button>
            </div>
          </section>

          <Separator />

          {/* Data Section */}
          <section>
            <h2 className="font-serif text-xl font-medium text-foreground mb-4">Data</h2>
            <div className="space-y-4">
              <div>
                <Button variant="outline">Export to CSV</Button>
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
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
