import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { calculateMonthlyPayment } from '@/hooks/useLoanSchedules';

interface LoanScenario {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  currency: string;
  closingCosts?: number;
}

interface CalculatedScenario extends LoanScenario {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

const CURRENCIES = ['EUR', 'USD', 'AED', 'GBP', 'CHF'];

const PRESET_SCENARIOS = [
  { label: 'Current Loan', principal: 500000, rate: 4.5, term: 240 },
  { label: 'Refinance (Lower Rate)', principal: 500000, rate: 3.5, term: 240 },
  { label: 'Refinance (Shorter Term)', principal: 500000, rate: 4.0, term: 180 },
];

export function LoanComparisonTool() {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<LoanScenario[]>([
    { id: '1', name: 'Current Loan', principal: 500000, interestRate: 4.5, termMonths: 240, currency: 'EUR', closingCosts: 0 },
    { id: '2', name: 'Refinance', principal: 500000, interestRate: 3.5, termMonths: 240, currency: 'EUR', closingCosts: 5000 },
  ]);

  const addScenario = () => {
    const newId = String(Date.now());
    setScenarios([
      ...scenarios,
      { id: newId, name: `Scenario ${scenarios.length + 1}`, principal: 500000, interestRate: 4.0, termMonths: 240, currency: 'EUR', closingCosts: 0 }
    ]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const updateScenario = (id: string, field: keyof LoanScenario, value: string | number) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const calculatedScenarios: CalculatedScenario[] = scenarios.map(scenario => {
    const monthlyPayment = calculateMonthlyPayment(
      scenario.principal,
      scenario.interestRate,
      scenario.termMonths
    );
    const totalPayment = monthlyPayment * scenario.termMonths;
    const totalInterest = totalPayment - scenario.principal;

    return {
      ...scenario,
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  });

  const bestMonthlyPayment = Math.min(...calculatedScenarios.map(s => s.monthlyPayment));
  const bestTotalInterest = Math.min(...calculatedScenarios.map(s => s.totalInterest));
  const bestTotalPayment = Math.min(...calculatedScenarios.map(s => s.totalPayment));

  const applyPreset = (index: number) => {
    const preset = PRESET_SCENARIOS[index];
    if (scenarios[index]) {
      updateScenario(scenarios[index].id, 'principal', preset.principal);
      updateScenario(scenarios[index].id, 'interestRate', preset.rate);
      updateScenario(scenarios[index].id, 'termMonths', preset.term);
      updateScenario(scenarios[index].id, 'name', preset.label);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Scale className="h-4 w-4" />
          Compare Loans
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loan Comparison Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground self-center">Quick presets:</span>
            {PRESET_SCENARIOS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(index)}
                disabled={!scenarios[index]}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Scenario Inputs */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(scenarios.length, 3)}, 1fr)` }}>
            {scenarios.map((scenario, index) => (
              <Card key={scenario.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={scenario.name}
                      onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                      className="font-medium h-8 w-32"
                    />
                    {scenarios.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Principal</Label>
                    <Input
                      type="number"
                      value={scenario.principal}
                      onChange={(e) => updateScenario(scenario.id, 'principal', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Interest Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={scenario.interestRate}
                      onChange={(e) => updateScenario(scenario.id, 'interestRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Term (months)</Label>
                    <Input
                      type="number"
                      value={scenario.termMonths}
                      onChange={(e) => updateScenario(scenario.id, 'termMonths', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Closing Costs</Label>
                    <Input
                      type="number"
                      value={scenario.closingCosts || 0}
                      onChange={(e) => updateScenario(scenario.id, 'closingCosts', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Currency</Label>
                    <Select
                      value={scenario.currency}
                      onValueChange={(value) => updateScenario(scenario.id, 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {scenarios.length < 4 && (
            <Button variant="outline" onClick={addScenario} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Scenario
            </Button>
          )}

          {/* Comparison Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparison Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">Monthly Payment</TableHead>
                    <TableHead className="text-right">Total Interest</TableHead>
                    <TableHead className="text-right">Total Payment</TableHead>
                    <TableHead className="text-right">Term</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedScenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {scenario.monthlyPayment === bestMonthlyPayment && calculatedScenarios.length > 1 && (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={scenario.monthlyPayment === bestMonthlyPayment && calculatedScenarios.length > 1 ? 'text-green-500 font-medium' : ''}>
                            {formatCurrency(scenario.monthlyPayment, scenario.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {scenario.totalInterest === bestTotalInterest && calculatedScenarios.length > 1 && (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={scenario.totalInterest === bestTotalInterest && calculatedScenarios.length > 1 ? 'text-green-500 font-medium' : ''}>
                            {formatCurrency(scenario.totalInterest, scenario.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {scenario.totalPayment === bestTotalPayment && calculatedScenarios.length > 1 && (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={scenario.totalPayment === bestTotalPayment && calculatedScenarios.length > 1 ? 'text-green-500 font-medium' : ''}>
                            {formatCurrency(scenario.totalPayment, scenario.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.floor(scenario.termMonths / 12)}y {scenario.termMonths % 12}m
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Savings Summary & Break-Even Analysis */}
              {calculatedScenarios.length > 1 && (() => {
                const baseScenario = calculatedScenarios[0];
                const refinanceScenarios = calculatedScenarios.slice(1);
                
                return (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Potential Savings</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Monthly payment difference:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(
                              Math.max(...calculatedScenarios.map(s => s.monthlyPayment)) - bestMonthlyPayment,
                              calculatedScenarios[0].currency
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total interest savings:</span>
                          <span className="ml-2 font-medium text-green-500">
                            {formatCurrency(
                              Math.max(...calculatedScenarios.map(s => s.totalInterest)) - bestTotalInterest,
                              calculatedScenarios[0].currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Refinancing Break-Even Analysis */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Refinancing Break-Even Analysis
                      </h4>
                      <div className="space-y-3">
                        {refinanceScenarios.map((refinance) => {
                          const monthlySavings = baseScenario.monthlyPayment - refinance.monthlyPayment;
                          const closingCosts = refinance.closingCosts || 0;
                          const breakEvenMonths = monthlySavings > 0 && closingCosts > 0 
                            ? Math.ceil(closingCosts / monthlySavings)
                            : 0;
                          const breakEvenYears = Math.floor(breakEvenMonths / 12);
                          const breakEvenRemainingMonths = breakEvenMonths % 12;
                          const totalSavingsAfterBreakEven = monthlySavings > 0 
                            ? (monthlySavings * refinance.termMonths) - closingCosts
                            : 0;

                          return (
                            <div key={refinance.id} className="p-3 bg-background rounded border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{refinance.name}</span>
                                {closingCosts > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    Closing costs: {formatCurrency(closingCosts, refinance.currency)}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-muted-foreground text-xs">Monthly Savings</div>
                                  <div className={monthlySavings > 0 ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
                                    {monthlySavings > 0 ? '+' : ''}{formatCurrency(monthlySavings, refinance.currency)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-xs">Break-Even Point</div>
                                  <div className="font-medium">
                                    {closingCosts === 0 ? (
                                      <span className="text-green-500">Immediate</span>
                                    ) : monthlySavings <= 0 ? (
                                      <span className="text-destructive">Never</span>
                                    ) : (
                                      <span>
                                        {breakEvenYears > 0 && `${breakEvenYears}y `}
                                        {breakEvenRemainingMonths}m
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-xs">Net Savings (Lifetime)</div>
                                  <div className={totalSavingsAfterBreakEven > 0 ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
                                    {totalSavingsAfterBreakEven > 0 ? '+' : ''}{formatCurrency(totalSavingsAfterBreakEven, refinance.currency)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-xs">Recommendation</div>
                                  <div className="font-medium">
                                    {closingCosts === 0 && monthlySavings > 0 ? (
                                      <span className="text-green-500">✓ Refinance</span>
                                    ) : breakEvenMonths > 0 && breakEvenMonths < refinance.termMonths / 2 ? (
                                      <span className="text-green-500">✓ Worth it</span>
                                    ) : breakEvenMonths > 0 && breakEvenMonths < refinance.termMonths ? (
                                      <span className="text-yellow-500">⚠ Consider</span>
                                    ) : (
                                      <span className="text-destructive">✗ Not recommended</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
