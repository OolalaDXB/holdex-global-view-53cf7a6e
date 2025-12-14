import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBlur } from '@/contexts/BlurContext';
import { formatCurrency } from '@/lib/currency';
import { Json } from '@/integrations/supabase/types';
import { RechartsTooltipProps } from '@/lib/types';

interface CertaintyBreakdown {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
}

interface ChartDataPoint {
  date: string;
  confirmed: number;
  projected: number;
}

interface CertaintyTrendChartProps {
  data: Array<{
    snapshot_date: string;
    certainty_breakdown_assets?: Json | null;
    certainty_breakdown_liabilities?: Json | null;
    net_worth_eur: number;
  }>;
  displayCurrency: string;
  convertFromEUR: (value: number, currency: string) => number;
}

function parseCertaintyBreakdown(json: Json | null | undefined): CertaintyBreakdown | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.certain !== 'number' || typeof obj.contractual !== 'number' ||
      typeof obj.probable !== 'number' || typeof obj.optional !== 'number') {
    return null;
  }
  return obj as unknown as CertaintyBreakdown;
}

export function CertaintyTrendChart({ data, displayCurrency, convertFromEUR }: CertaintyTrendChartProps) {
  const { isBlurred } = useBlur();

  // Transform data into chart format
  const chartData: ChartDataPoint[] = data.map(item => {
    let confirmed = 0;
    let projected = 0;

    const assets = parseCertaintyBreakdown(item.certainty_breakdown_assets);
    const liabilities = parseCertaintyBreakdown(item.certainty_breakdown_liabilities);

    if (assets && liabilities) {
      const confirmedAssets = (assets.certain || 0) + (assets.contractual || 0);
      const confirmedLiabilities = (liabilities.certain || 0) + (liabilities.contractual || 0);
      const projectedAssets = (assets.probable || 0) + (assets.optional || 0);
      const projectedLiabilities = (liabilities.probable || 0) + (liabilities.optional || 0);
      
      confirmed = convertFromEUR(confirmedAssets - confirmedLiabilities, displayCurrency);
      projected = convertFromEUR(projectedAssets - projectedLiabilities, displayCurrency);
    } else {
      // Fallback for old snapshots without certainty data
      confirmed = convertFromEUR(item.net_worth_eur, displayCurrency);
      projected = 0;
    }

    return {
      date: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      confirmed,
      projected,
    };
  });

  // Check if we have any certainty data
  const hasCertaintyData = data.some(item => 
    parseCertaintyBreakdown(item.certainty_breakdown_assets) && 
    parseCertaintyBreakdown(item.certainty_breakdown_liabilities)
  );

  const formatValue = (value: number) => {
    if (isBlurred) return '•••••';
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}:</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {isBlurred ? '•••••' : formatCurrency(entry.value, displayCurrency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!hasCertaintyData) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        <p>Save snapshots to track certainty trends over time</p>
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={formatValue}
            dx={-10}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={30}
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="confirmed"
            name="Confirmed"
            stroke="hsl(var(--positive))"
            strokeWidth={2}
            fill="url(#confirmedGradient)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="projected"
            name="Projected"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#projectedGradient)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
