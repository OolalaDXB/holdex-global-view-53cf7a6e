import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export type ViewMode = 'all' | 'financial' | 'custom';

export interface ViewConfig {
  mode: ViewMode;
  customTypes: string[];
  includeFrozenBlocked: boolean;
}

const ASSET_TYPES = [
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'bank', label: 'Bank Accounts' },
  { id: 'investment', label: 'Investments' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'business', label: 'Business Equity' },
  { id: 'collections', label: 'Collections' },
];

const FINANCIAL_TYPES = ['real-estate', 'bank', 'investment', 'crypto', 'business'];

const STORAGE_KEY = 'dashboard-view-config';

const defaultConfig: ViewConfig = {
  mode: 'all',
  customTypes: ASSET_TYPES.map(t => t.id),
  includeFrozenBlocked: true,
};

export function useViewConfig() {
  const [config, setConfig] = useState<ViewConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const getIncludedTypes = (): string[] => {
    switch (config.mode) {
      case 'all':
        return ASSET_TYPES.map(t => t.id);
      case 'financial':
        return FINANCIAL_TYPES;
      case 'custom':
        return config.customTypes;
      default:
        return ASSET_TYPES.map(t => t.id);
    }
  };

  const includesCollections = (): boolean => {
    return getIncludedTypes().includes('collections');
  };

  const shouldIncludeAsset = (liquidityStatus: string | null | undefined): boolean => {
    if (config.includeFrozenBlocked) return true;
    const status = liquidityStatus || 'liquid';
    return status === 'liquid' || status === 'restricted';
  };

  return { config, setConfig, getIncludedTypes, includesCollections, shouldIncludeAsset };
}

interface ViewToggleProps {
  config: ViewConfig;
  onChange: (config: ViewConfig) => void;
}

export function ViewToggle({ config, onChange }: ViewToggleProps) {
  const [open, setOpen] = useState(false);

  const handleModeChange = (mode: ViewMode) => {
    if (mode === 'custom' && config.mode !== 'custom') {
      // When switching to custom, initialize with all types
      onChange({ ...config, mode, customTypes: ASSET_TYPES.map(t => t.id) });
    } else {
      onChange({ ...config, mode });
    }
    if (mode !== 'custom') {
      setOpen(false);
    }
  };

  const handleTypeToggle = (typeId: string) => {
    const newTypes = config.customTypes.includes(typeId)
      ? config.customTypes.filter(t => t !== typeId)
      : [...config.customTypes, typeId];
    onChange({ ...config, mode: 'custom', customTypes: newTypes });
  };

  const handleFrozenToggle = () => {
    onChange({ ...config, includeFrozenBlocked: !config.includeFrozenBlocked });
  };

  const getModeLabel = () => {
    switch (config.mode) {
      case 'all':
        return 'All';
      case 'financial':
        return 'Financial';
      case 'custom':
        return `Custom (${config.customTypes.length})`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors",
            "bg-secondary/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {getModeLabel()}
          <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          {/* Mode options */}
          <button
            onClick={() => handleModeChange('all')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
              config.mode === 'all' 
                ? "bg-primary/10 text-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span>All Assets</span>
            {config.mode === 'all' && <Check size={14} />}
          </button>
          
          <button
            onClick={() => handleModeChange('financial')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
              config.mode === 'financial' 
                ? "bg-primary/10 text-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span>Financial Only</span>
            {config.mode === 'financial' && <Check size={14} />}
          </button>

          <button
            onClick={() => handleModeChange('custom')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
              config.mode === 'custom' 
                ? "bg-primary/10 text-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span>Custom</span>
            {config.mode === 'custom' && <Check size={14} />}
          </button>

          {/* Custom type selection */}
          {config.mode === 'custom' && (
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              {ASSET_TYPES.map((type) => (
                <div key={type.id} className="flex items-center gap-2 px-3">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={config.customTypes.includes(type.id)}
                    onCheckedChange={() => handleTypeToggle(type.id)}
                  />
                  <Label 
                    htmlFor={`type-${type.id}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Frozen/Blocked toggle */}
          <Separator className="my-2" />
          <div className="flex items-center gap-2 px-3 py-1">
            <Checkbox
              id="include-frozen"
              checked={config.includeFrozenBlocked}
              onCheckedChange={handleFrozenToggle}
            />
            <Label 
              htmlFor="include-frozen"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Include frozen/blocked
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
