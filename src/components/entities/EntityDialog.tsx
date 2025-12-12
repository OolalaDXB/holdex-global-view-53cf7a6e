import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CountrySelect } from '@/components/ui/country-select';
import { Entity, EntityInsert, ENTITY_TYPES, useEntities } from '@/hooks/useEntities';
import { Loader2 } from 'lucide-react';

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: Entity | null;
  onSave: (data: Omit<EntityInsert, 'user_id'>) => Promise<void>;
  isLoading?: boolean;
}

const ENTITY_COLORS = [
  '#C4785A', // Terracotta (default)
  '#7D8B75', // Sage
  '#9B6B6B', // Dusty rose
  '#6B7B9B', // Slate blue
  '#8B7D6B', // Warm gray
  '#6B9B8B', // Teal
  '#9B8B6B', // Gold
  '#7B6B9B', // Purple
];

const ENTITY_ICONS = ['👤', '💑', '👫', '🏢', '🏛️', '📁', '🔒', '👨‍👩‍👧‍👦', '💼', '🏠', '🌍', '💰'];

export const EntityDialog = ({
  open,
  onOpenChange,
  entity,
  onSave,
  isLoading,
}: EntityDialogProps) => {
  const { data: entities } = useEntities();
  const [formData, setFormData] = useState<Omit<EntityInsert, 'user_id'>>({
    name: '',
    type: 'company',
    legal_name: '',
    registration_number: '',
    country: '',
    jurisdiction: '',
    is_active: true,
    formation_date: undefined,
    owned_by_entity_id: undefined,
    ownership_percentage: 100,
    color: '#C4785A',
    icon: '🏢',
    notes: '',
  });

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name,
        type: entity.type,
        legal_name: entity.legal_name || '',
        registration_number: entity.registration_number || '',
        country: entity.country || '',
        jurisdiction: entity.jurisdiction || '',
        is_active: entity.is_active,
        formation_date: entity.formation_date || undefined,
        owned_by_entity_id: entity.owned_by_entity_id || undefined,
        ownership_percentage: entity.ownership_percentage || 100,
        color: entity.color || '#C4785A',
        icon: entity.icon || '🏢',
        notes: entity.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'company',
        legal_name: '',
        registration_number: '',
        country: '',
        jurisdiction: '',
        is_active: true,
        formation_date: undefined,
        owned_by_entity_id: undefined,
        ownership_percentage: 100,
        color: '#C4785A',
        icon: '🏢',
        notes: '',
      });
    }
  }, [entity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onOpenChange(false);
  };

  const isPersonalType = entity?.type === 'personal';
  const availableParentEntities = entities?.filter(e => e.id !== entity?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entity ? 'Edit Entity' : 'Add Entity'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Entity name"
                required
                disabled={isPersonalType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  const typeInfo = ENTITY_TYPES.find(t => t.value === value);
                  setFormData({ 
                    ...formData, 
                    type: value,
                    icon: typeInfo?.icon || formData.icon,
                  });
                }}
                disabled={isPersonalType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input
                id="legal_name"
                value={formData.legal_name || ''}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Full legal name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration #</Label>
              <Input
                id="registration_number"
                value={formData.registration_number || ''}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="Company number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Country</Label>
            <CountrySelect
              value={formData.country || ''}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                value={formData.jurisdiction || ''}
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                placeholder="e.g., Delaware, BVI"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="formation_date">Formation Date</Label>
              <Input
                id="formation_date"
                type="date"
                value={formData.formation_date || ''}
                onChange={(e) => setFormData({ ...formData, formation_date: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>Owned By</Label>
              <Select
                value={formData.owned_by_entity_id || 'none'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  owned_by_entity_id: value === 'none' ? undefined : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableParentEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.icon} {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.owned_by_entity_id && (
            <div className="space-y-2">
              <Label htmlFor="ownership_percentage">Ownership %</Label>
              <Input
                id="ownership_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.ownership_percentage || 100}
                onChange={(e) => setFormData({ ...formData, ownership_percentage: Number(e.target.value) })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Color & Icon</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {ENTITY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full transition-transform ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
              <div className="flex gap-1 border-l pl-4">
                {ENTITY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${
                      formData.icon === icon ? 'bg-primary/20' : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entity ? 'Save Changes' : 'Create Entity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
