import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemo } from '@/contexts/DemoContext';
import { formatCurrency } from '@/lib/currency';
import { Calculator, TrendingDown, Calendar, DollarSign, Clock } from 'lucide-react';
import { addMonths, format } from 'date-fns';

interface PayoffScenario {
  totalPayments: number;
  totalInterest: number;
  payoffDate: Date;
  monthsToPayoff: number;
}

function calculatePayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  extraPayment: number = 0
): PayoffScenario | null {
  if (monthlyPayment + extraPayment <= 0) return null;
  
  const monthlyRate = annualRate / 100 / 12;
  let remaining = balance;
  let totalPayments = 0;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600;
  
  while (remaining > 0.01 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    const payment = Math.min(monthlyPayment + extraPayment, remaining + interest);
    const principal = payment - interest;
    
    remaining -= principal;
    totalInterest += interest;
    totalPayments += payment;
    months++;
  }
  
  if (months >= maxMonths) return null;
  
  return {
    totalPayments,
    totalInterest,
    payoffDate: addMonths(new Date(), months),
    monthsToPayoff: months,
  };
}

export function DemoLoanPayoffCalculator() {
  const { liabilities } = useDemo();
  const [open, setOpen] = useState(false);
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string>('');
  const [extraPayment, setExtraPayment] = useState<string>('0');
  
  const selectedLiability = liabilities.find(l => l.id === selectedLiabilityId);
  
  const scenarios = useMemo(() => {
    if (!selectedLiability || !selectedLiability.monthly_payment || !selectedLiability.interest_rate) {
      return null;
    }
    
    const balance = selectedLiability.current_balance;
    const rate = selectedLiability.interest_rate;
    const payment = selectedLiability.monthly_payment;
    const extra = parseFloat(extraPayment) || 0;
    
    const original = calculatePayoff(balance, rate, payment, 0);
    const withExtra = calculatePayoff(balance, rate, payment, extra);
    
    if (!original || !withExtra) return null;
    
    return { original, withExtra };
  }, [selectedLiability, extraPayment]);
  
  const savings = scenarios ? {
    interest: scenarios.original.totalInterest - scenarios.withExtra.totalInterest,
    months: scenarios.original.monthsToPayoff - scenarios.withExtra.monthsToPayoff,
  } : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calculator className="h-4 w-4" />
          Payoff Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loan Payoff Calculator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Loan</Label>
            <Select value={selectedLiabilityId} onValueChange={setSelectedLiabilityId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a loan..." />
              </SelectTrigger>
              <SelectContent>
                {liabilities
                  .filter(l => l.monthly_payment && l.interest_rate)
                  .map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} - {formatCurrency(l.current_balance, l.currency)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedLiability && (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(selectedLiability.current_balance, selectedLiability.currency)}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="font-medium tabular-nums">{selectedLiability.interest_rate}%</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(selectedLiability.monthly_payment || 0, selectedLiability.currency)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Extra Monthly Payment</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="50"
                  />
                  <span className="flex items-center text-sm text-muted-foreground px-2">
                    {selectedLiability.currency}/mo
                  </span>
                </div>
              </div>
              
              {scenarios && savings && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-secondary/30">
                      <CardContent className="p-4 space-y-3">
                        <Badge variant="outline" className="text-xs">Current</Badge>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Payoff Date
                          </p>
                          <p className="font-medium text-sm">
                            {format(scenarios.original.payoffDate, 'MMM yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({scenarios.original.monthsToPayoff} months)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Total Interest
                          </p>
                          <p className="font-medium text-sm text-dusty-rose tabular-nums">
                            {formatCurrency(scenarios.original.totalInterest, selectedLiability.currency)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-sage/10 border-sage/30">
                      <CardContent className="p-4 space-y-3">
                        <Badge className="bg-sage text-sage-foreground text-xs">With Extra</Badge>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Payoff Date
                          </p>
                          <p className="font-medium text-sm">
                            {format(scenarios.withExtra.payoffDate, 'MMM yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({scenarios.withExtra.monthsToPayoff} months)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Total Interest
                          </p>
                          <p className="font-medium text-sm text-sage tabular-nums">
                            {formatCurrency(scenarios.withExtra.totalInterest, selectedLiability.currency)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {parseFloat(extraPayment) > 0 && (
                    <div className="bg-sage/10 border border-sage/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-sage mb-2">Your Savings</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> Interest Saved
                          </p>
                          <p className="font-semibold text-sage tabular-nums">
                            {formatCurrency(savings.interest, selectedLiability.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Time Saved
                          </p>
                          <p className="font-semibold text-sage">
                            {savings.months} months
                            {savings.months >= 12 && (
                              <span className="text-xs font-normal ml-1">
                                ({(savings.months / 12).toFixed(1)} years)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {liabilities.filter(l => l.monthly_payment && l.interest_rate).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No loans with payment schedules available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
