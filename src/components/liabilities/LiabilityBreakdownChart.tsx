import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLiabilityTypeInfo } from '@/hooks/useLiabilities';
import { formatCurrency } from '@/lib/currency';
import { RechartsTooltipProps, RechartsLegendProps } from '@/lib/types';

interface LiabilityBreakdownChartProps {
  liabilities: Array<{
    type: string;
    current_balance: number;
    currency: string;
  }>;
  baseCurrency?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--dusty-rose))',
  'hsl(var(--sage))',
  'hsl(var(--terracotta))',
  'hsl(var(--muted-foreground))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(160, 60%, 40%)',
  'hsl(40, 80%, 50%)',
  'hsl(200, 60%, 50%)',
];

export function LiabilityBreakdownChart({ liabilities, baseCurrency = 'EUR' }: LiabilityBreakdownChartProps) {
  const chartData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    liabilities.forEach(l => {
      const type = l.type || 'other';
      breakdown[type] = (breakdown[type] || 0) + l.current_balance;
    });
    
    return Object.entries(breakdown)
      .map(([type, value]) => {
        const typeInfo = getLiabilityTypeInfo(type);
        return {
          name: typeInfo?.label || type,
          value,
          type,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [liabilities]);
  
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  if (chartData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as { name: string; value: number };
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-md px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatCurrency(data.value, baseCurrency)}
          </p>
          <p className="text-xs text-muted-foreground">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: RechartsLegendProps) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Liabilities by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">Total Liabilities</p>
          <p className="text-lg font-semibold text-dusty-rose tabular-nums">
            -{formatCurrency(total, baseCurrency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
