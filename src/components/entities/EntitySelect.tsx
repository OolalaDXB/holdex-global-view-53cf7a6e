import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEntities, ENTITY_TYPES } from '@/hooks/useEntities';
import { Loader2 } from 'lucide-react';

interface EntitySelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const EntitySelect = ({
  value,
  onChange,
  className,
  placeholder = 'Select owner',
  disabled,
}: EntitySelectProps) => {
  const { data: entities, isLoading } = useEntities();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No specific owner</span>
        </SelectItem>
        {entities?.map((entity) => {
          const typeInfo = ENTITY_TYPES.find(t => t.value === entity.type);
          return (
            <SelectItem key={entity.id} value={entity.id}>
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entity.color || '#C4785A' }}
                />
                <span>{entity.icon || typeInfo?.icon}</span>
                <span>{entity.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
