import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelect } from '@/components/ui/country-select';
import { useEntities, useCreateEntity, ENTITY_TYPES } from '@/hooks/useEntities';
import { Loader2, User, Plus } from 'lucide-react';

const QUICK_ENTITY_TYPES = [
  { value: 'spouse', label: 'Spouse', color: '#9B6B6B' },
  { value: 'couple', label: 'Couple (joint)', color: '#7D8B75' },
  { value: 'company', label: 'Company', color: '#6B7B9B' },
  { value: 'holding', label: 'Holding', color: '#8B7B6B' },
  { value: 'trust', label: 'Trust', color: '#6B8B7B' },
];

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
  const createEntity = useCreateEntity();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', type: 'spouse', country: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Find personal entity and sort entities for better UX
  const { personalEntity, otherEntities } = useMemo(() => {
    if (!entities) return { personalEntity: null, otherEntities: [] };
    
    const personal = entities.find(e => e.type === 'personal');
    const others = entities.filter(e => e.type !== 'personal');
    
    return { personalEntity: personal, otherEntities: others };
  }, [entities]);

  const handleCreateEntity = async () => {
    if (!newEntity.name.trim()) return;
    
    setIsCreating(true);
    try {
      const typeInfo = QUICK_ENTITY_TYPES.find(t => t.value === newEntity.type);
      const result = await createEntity.mutateAsync({
        name: newEntity.name.trim(),
        type: newEntity.type,
        country: newEntity.country || null,
        color: typeInfo?.color || '#C4785A',
        icon: newEntity.type === 'spouse' ? '👤' : '🏢',
        owned_by_entity_id: personalEntity?.id || null,
        ownership_percentage: 100,
      });
      
      onChange(result.id);
      setShowCreateDialog(false);
      setNewEntity({ name: '', type: 'spouse', country: '' });
    } catch (error) {
      console.error('Failed to create entity:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // Get display name for selected value
  const getSelectedDisplay = () => {
    if (!value || value === 'none') return placeholder;
    
    const entity = entities?.find(e => e.id === value);
    if (!entity) return placeholder;
    
    if (entity.type === 'personal') {
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>Personal (me)</span>
        </div>
      );
    }
    
    const typeInfo = ENTITY_TYPES.find(t => t.value === entity.type);
    return (
      <div className="flex items-center gap-2">
        <span 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: entity.color || '#C4785A' }}
        />
        <span>{entity.icon || typeInfo?.icon}</span>
        <span>{entity.name}</span>
        {entity.ownership_percentage && entity.ownership_percentage < 100 && (
          <span className="text-muted-foreground text-xs">({entity.ownership_percentage}%)</span>
        )}
      </div>
    );
  };

  const handleValueChange = (v: string) => {
    if (v === 'create-new') {
      setShowCreateDialog(true);
    } else {
      onChange(v === 'none' ? null : v);
    }
  };

  return (
    <>
      <Select
        value={value || 'none'}
        onValueChange={handleValueChange}
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
          
          {/* Other entities: spouse, companies, trusts, etc. */}
          {otherEntities.map((entity) => {
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
                  {entity.ownership_percentage && entity.ownership_percentage < 100 && (
                    <span className="text-muted-foreground text-xs">({entity.ownership_percentage}%)</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
          
          {/* Create new option */}
          <div className="h-px bg-border my-1" />
          <SelectItem value="create-new">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-4 w-4" />
              <span>Create new entity...</span>
            </div>
          </SelectItem>
          
          {/* No specific owner option at the end */}
          <SelectItem value="none">
            <span className="text-muted-foreground">No specific owner</span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Quick Entity Creation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Create New Entity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="entity-name">Name</Label>
              <Input
                id="entity-name"
                value={newEntity.name}
                onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                placeholder="e.g., Darya or My Company LLC"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newEntity.type}
                onValueChange={(v) => setNewEntity({ ...newEntity, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUICK_ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Country (optional)</Label>
              <CountrySelect
                value={newEntity.country}
                onValueChange={(v) => setNewEntity({ ...newEntity, country: v })}
                placeholder="Select country"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateEntity}
                disabled={!newEntity.name.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create & Select'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook to get the default entity (Personal) for new assets
export const useDefaultEntity = () => {
  const { data: entities } = useEntities();
  
  return useMemo(() => {
    if (!entities) return null;
    const personal = entities.find(e => e.type === 'personal');
    return personal?.id || null;
  }, [entities]);
};
