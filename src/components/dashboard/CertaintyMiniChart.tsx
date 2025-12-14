import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useBlur } from '@/contexts/BlurContext';
import { Json } from '@/integrations/supabase/types';
import { CheckCircle2, TrendingUp } from 'lucide-react';

interface CertaintyBreakdown {
  certain: number;
  contractual: number;
  probable: number;
  optional: number;
}

interface CertaintyMiniChartProps {
  data: Array<{
    snapshot_date: string;
    certainty_breakdown_assets?: Json | null;
    certainty_breakdown_liabilities?: Json | null;
    net_worth_eur: number;
  }>;
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

export function CertaintyMiniChart({ data }: CertaintyMiniChartProps) {
  const { isBlurred } = useBlur();

  // Transform data into chart format (percentages)
  const chartData = data.map(item => {
    const assets = parseCertaintyBreakdown(item.certainty_breakdown_assets);
    
    if (assets) {
      const total = assets.certain + assets.contractual + assets.probable + assets.optional;
      if (total > 0) {
        const confirmedPct = ((assets.certain + assets.contractual) / total) * 100;
        const projectedPct = ((assets.probable + assets.optional) / total) * 100;
        return {
          date: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          confirmed: confirmedPct,
          projected: projectedPct,
        };
      }
    }
    
    return {
      date: new Date(item.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      confirmed: 100,
      projected: 0,
    };
  });

  // Check if we have any certainty data
  const hasCertaintyData = data.some(item => 
    parseCertaintyBreakdown(item.certainty_breakdown_assets)
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && !isBlurred) {
      return (
        <div className="bg-card border border-border rounded-md px-2 py-1.5 shadow-lg">
          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-0.5 text-positive">
              <CheckCircle2 size={8} />
              {payload[0]?.value?.toFixed(0)}%
            </span>
            <span className="flex items-center gap-0.5 text-warning">
              <TrendingUp size={8} />
              {payload[1]?.value?.toFixed(0)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasCertaintyData || data.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-muted-foreground text-[10px]">
        <p>Need more snapshots</p>
      </div>
    );
  }

  // Get latest values for legend
  const latest = chartData[chartData.length - 1];

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="miniConfirmedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="miniProjectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="confirmed"
              stroke="hsl(var(--positive))"
              strokeWidth={1.5}
              fill="url(#miniConfirmedGradient)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--warning))"
              strokeWidth={1.5}
              fill="url(#miniProjectedGradient)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col text-[10px]">
        <span className="flex items-center gap-0.5 text-positive">
          <CheckCircle2 size={8} />
          {latest?.confirmed?.toFixed(0)}%
        </span>
        <span className="flex items-center gap-0.5 text-warning">
          <TrendingUp size={8} />
          {latest?.projected?.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
