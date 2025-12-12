import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDemo } from '@/contexts/DemoContext';
import { User } from 'lucide-react';
import { useMemo } from 'react';

interface DemoEntitySelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const DemoEntitySelect = ({
  value,
  onChange,
  className,
  placeholder = 'Select owner',
  disabled,
}: DemoEntitySelectProps) => {
  const { entities } = useDemo();

  // Find personal entity and sort entities for better UX
  const { personalEntity, otherEntities } = useMemo(() => {
    const personal = entities.find(e => e.type === 'personal');
    const others = entities.filter(e => e.type !== 'personal');
    
    return { personalEntity: personal, otherEntities: others };
  }, [entities]);

  // Get display name for selected value
  const getSelectedDisplay = () => {
    if (!value || value === 'none') return placeholder;
    
    const entity = entities.find(e => e.id === value);
    if (!entity) return placeholder;
    
    if (entity.type === 'personal') {
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>Personal (me)</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <span 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: entity.color || '#C4785A' }}
        />
        <span>{entity.name}</span>
        {entity.ownership_percentage && entity.ownership_percentage < 100 && (
          <span className="text-muted-foreground text-xs">({entity.ownership_percentage}%)</span>
        )}
      </div>
    );
  };

  return (
    <Select
      value={value || 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {getSelectedDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Personal entity first - most common case */}
        {personalEntity && (
          <SelectItem value={personalEntity.id}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-medium">Personal (me)</span>
              <span className="text-muted-foreground text-xs">(100%)</span>
            </div>
          </SelectItem>
        )}
        
        {/* Separator if we have other entities */}
        {otherEntities.length > 0 && personalEntity && (
          <div className="h-px bg-border my-1" />
        )}
        
        {/* Other entities: companies, holdings, etc. */}
        {otherEntities.map((entity) => (
          <SelectItem key={entity.id} value={entity.id}>
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entity.color || '#C4785A' }}
              />
              <span>{entity.name}</span>
              {entity.ownership_percentage && entity.ownership_percentage < 100 && (
                <span className="text-muted-foreground text-xs">({entity.ownership_percentage}%)</span>
              )}
            </div>
          </SelectItem>
        ))}
        
        {/* No specific owner option at the end */}
        {(personalEntity || otherEntities.length > 0) && (
          <div className="h-px bg-border my-1" />
        )}
        <SelectItem value="none">
          <span className="text-muted-foreground">No specific owner</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

// Hook to get the default entity (Personal) for demo mode
export const useDemoDefaultEntity = () => {
  const { entities } = useDemo();
  
  return useMemo(() => {
    const personal = entities.find(e => e.type === 'personal');
    return personal?.id || null;
  }, [entities]);
};
