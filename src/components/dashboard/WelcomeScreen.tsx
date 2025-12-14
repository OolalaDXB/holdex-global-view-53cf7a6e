import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gem, BarChart3, TrendingUp, Shield, Eye } from 'lucide-react';

interface WelcomeScreenProps {
  userName?: string;
}

export function WelcomeScreen({ userName }: WelcomeScreenProps) {
  const displayName = userName || 'there';

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Welcome back
        </p>
        <h1 className="font-serif text-4xl font-medium text-foreground">
          {displayName}
        </h1>
      </div>

      {/* Main Welcome Card */}
      <Card className="border border-border bg-card p-8 md:p-12 text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Gem className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
          Welcome to Verso
        </h2>
        
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Your wealth management dashboard is ready. Start by adding your first asset or explore the demo to see what is possible.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild className="gap-2">
            <Link to="/add">
              Add Your First Asset
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/demo">
              <Eye size={16} />
              View Demo
            </Link>
          </Button>
        </div>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-card p-6">
          <div className="mb-4">
            <BarChart3 className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="font-medium text-foreground mb-1">Track Assets</h3>
          <p className="text-sm text-muted-foreground">
            Real estate, investments, crypto
          </p>
        </Card>

        <Card className="border border-border bg-card p-6">
          <div className="mb-4">
            <TrendingUp className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="font-medium text-foreground mb-1">Multi-Currency</h3>
          <p className="text-sm text-muted-foreground">
            Live exchange rates
          </p>
        </Card>

        <Card className="border border-border bg-card p-6">
          <div className="mb-4">
            <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="font-medium text-foreground mb-1">Secure</h3>
          <p className="text-sm text-muted-foreground">
            Bank-level encryption
          </p>
        </Card>
      </div>
    </div>
  );
}
