import { AlertTriangle } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeaseholdAsset {
  id: string;
  name: string;
  tenure_type?: string | null;
  lease_end_date?: string | null;
  country: string;
}

interface LeaseholdRemindersWidgetProps {
  assets: LeaseholdAsset[];
}

export function LeaseholdRemindersWidget({ assets }: LeaseholdRemindersWidgetProps) {
  const leaseholdAssets = assets.filter(
    (asset) => asset.tenure_type === 'leasehold' && asset.lease_end_date
  );

  const assetsWithWarnings = leaseholdAssets
    .map((asset) => {
      const yearsRemaining = differenceInYears(
        new Date(asset.lease_end_date!),
        new Date()
      );
      return { ...asset, yearsRemaining };
    })
    .filter((asset) => asset.yearsRemaining < 85)
    .sort((a, b) => a.yearsRemaining - b.yearsRemaining);

  if (assetsWithWarnings.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-warning" />
          <h3 className="font-serif text-sm font-medium text-foreground">
            Leasehold Reminders
          </h3>
        </div>
        <div className="space-y-2">
          {assetsWithWarnings.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "flex items-center justify-between text-sm p-2 rounded",
                asset.yearsRemaining < 30
                  ? "bg-destructive/10 text-destructive"
                  : asset.yearsRemaining < 80
                  ? "bg-warning/10 text-warning"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="font-medium">{asset.name}</span>
              <span>
                {asset.yearsRemaining} years remaining
                {asset.yearsRemaining < 80 && (
                  <span className="ml-2 text-xs opacity-75">
                    (Lease extension recommended)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Properties with less than 80 years remaining may face mortgage restrictions.
        </p>
      </div>
    </section>
  );
}
