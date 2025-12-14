import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatCurrency, convertToEUR, convertFromEUR, fallbackRates } from '@/lib/currency';
import { useDemo } from '@/contexts/DemoContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, Info } from 'lucide-react';
import { RechartsTooltipProps } from '@/lib/types';

interface DemoNetWorthProjectionWidgetProps {
  isBlurred?: boolean;
  delay?: number;
}

export function DemoNetWorthProjectionWidget({
  isBlurred = false,
  delay = 0,
}: DemoNetWorthProjectionWidgetProps) {
  const { assets, collections, liabilities, profile } = useDemo();
  const { displayCurrency } = useCurrency();
  const rates = fallbackRates;

  // Calculate current net worth
  const totalAssetsEUR = assets.reduce((sum, a) => sum + convertToEUR(a.current_value, a.currency, rates), 0);
  const totalCollectionsEUR = collections.reduce((sum, c) => sum + convertToEUR(c.current_value, c.currency, rates), 0);
  const totalLiabilitiesEUR = liabilities.reduce((sum, l) => sum + convertToEUR(l.current_balance, l.currency, rates), 0);
  const currentNetWorthEUR = totalAssetsEUR + totalCollectionsEUR - totalLiabilitiesEUR;
  const currentNetWorth = convertFromEUR(currentNetWorthEUR, displayCurrency, rates);

  const monthlyIncome = profile?.monthly_income ?? 18500;

  const [savingsRate, setSavingsRate] = useState(20);
  const [returnRate, setReturnRate] = useState(7);
  const [years, setYears] = useState(10);

  const projectionData = useMemo(() => {
    const monthlySavings = (monthlyIncome * savingsRate) / 100;
    const monthlyReturn = returnRate / 100 / 12;
    
    const data = [];
    let balance = currentNetWorth;
    
    for (let year = 0; year <= years; year++) {
      data.push({
        year,
        value: balance,
        label: year === 0 ? 'Now' : `${year}y`,
      });
      
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + monthlySavings;
      }
    }
    
    return data;
  }, [currentNetWorth, monthlyIncome, savingsRate, returnRate, years]);

  const finalValue = projectionData[projectionData.length - 1]?.value || currentNetWorth;
  const growthPercent = currentNetWorth > 0 ? ((finalValue - currentNetWorth) / currentNetWorth) * 100 : 0;

  const CustomTooltip = ({ active, payload }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as { year: number; value: number };
      return (
        <div className="bg-card border border-border rounded-md px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">
            {data.year === 0 ? 'Current' : `Year ${data.year}`}
          </p>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {isBlurred ? '•••••' : formatCurrency(data.value, displayCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="bg-card border-border mb-6 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Net Worth Projection
          </CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Projection assumes monthly contributions and compound annual returns.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--sage))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--sage))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Projected in {years} years</p>
            <p className="text-lg font-semibold tabular-nums text-sage">
              {isBlurred ? '•••••' : formatCurrency(finalValue, displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Growth</p>
            <p className="text-lg font-semibold tabular-nums text-sage">
              {isBlurred ? '••' : `+${growthPercent.toFixed(0)}%`}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-border">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="text-muted-foreground">Savings Rate</Label>
              <span className="text-foreground font-medium">{savingsRate}%</span>
            </div>
            <Slider
              value={[savingsRate]}
              onValueChange={(v) => setSavingsRate(v[0])}
              min={0}
              max={50}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="text-muted-foreground">Annual Return</Label>
              <span className="text-foreground font-medium">{returnRate}%</span>
            </div>
            <Slider
              value={[returnRate]}
              onValueChange={(v) => setReturnRate(v[0])}
              min={0}
              max={15}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="text-muted-foreground">Projection Period</Label>
              <span className="text-foreground font-medium">{years} years</span>
            </div>
            <Slider
              value={[years]}
              onValueChange={(v) => setYears(v[0])}
              min={5}
              max={30}
              step={5}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
