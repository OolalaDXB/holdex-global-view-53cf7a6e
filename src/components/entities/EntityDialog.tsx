import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CountrySelect } from '@/components/ui/country-select';
import { Entity, EntityInsert, ENTITY_TYPES, MATRIMONIAL_REGIMES, LEGAL_FORMS, TRUST_TYPES, useEntities, getFilteredEntityTypes, getFilteredTrustTypes } from '@/hooks/useEntities';
import { Loader2, User, UserCircle, Users, Building2, Landmark, FolderClosed, Shield, Home } from 'lucide-react';
import { useComplianceMode } from '@/hooks/useComplianceMode';
import { EntityIcon, getEntityIconName } from './EntityIcon';
import { useCurrencyList } from '@/hooks/useCurrencyList';

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

// Icons are now handled by EntityIcon component

// Get category of entity type
const getEntityCategory = (type: string) => {
  const entityType = ENTITY_TYPES.find(t => t.value === type);
  return entityType?.category || 'legal_entity';
};

export const EntityDialog = ({
  open,
  onOpenChange,
  entity,
  onSave,
  isLoading,
}: EntityDialogProps) => {
  const { data: entities } = useEntities();
  const { showHindu, showIslamic } = useComplianceMode();
  const currencies = useCurrencyList();
  const filteredEntityTypes = getFilteredEntityTypes(showHindu);
  const filteredTrustTypes = getFilteredTrustTypes(showIslamic);
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
    icon: 'Building2',
    notes: '',
    // Individual fields
    date_of_birth: undefined,
    nationality: undefined,
    tax_residence: undefined,
    // Couple fields
    matrimonial_regime: undefined,
    marriage_date: undefined,
    marriage_country: undefined,
    // Company fields
    legal_form: undefined,
    share_capital: undefined,
    share_capital_currency: 'EUR',
    // Trust fields
    trustee_name: undefined,
    beneficiaries: undefined,
    trust_type: undefined,
    // HUF fields
    karta_name: undefined,
    coparceners: undefined,
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
        // @ts-ignore - New fields from migration
        date_of_birth: entity.date_of_birth || undefined,
        // @ts-ignore
        nationality: entity.nationality || undefined,
        // @ts-ignore
        tax_residence: entity.tax_residence || undefined,
        // @ts-ignore
        matrimonial_regime: entity.matrimonial_regime || undefined,
        // @ts-ignore
        marriage_date: entity.marriage_date || undefined,
        // @ts-ignore
        marriage_country: entity.marriage_country || undefined,
        // @ts-ignore
        legal_form: entity.legal_form || undefined,
        // @ts-ignore
        share_capital: entity.share_capital || undefined,
        // @ts-ignore
        share_capital_currency: entity.share_capital_currency || 'EUR',
        // @ts-ignore
        trustee_name: entity.trustee_name || undefined,
        // @ts-ignore
        beneficiaries: entity.beneficiaries || undefined,
        // @ts-ignore
        trust_type: entity.trust_type || undefined,
        // @ts-ignore
        karta_name: entity.karta_name || undefined,
        // @ts-ignore
        coparceners: entity.coparceners || undefined,
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
        icon: 'Building2',
        notes: '',
        date_of_birth: undefined,
        nationality: undefined,
        tax_residence: undefined,
        matrimonial_regime: undefined,
        marriage_date: undefined,
        marriage_country: undefined,
        legal_form: undefined,
        share_capital: undefined,
        share_capital_currency: 'EUR',
        trustee_name: undefined,
        beneficiaries: undefined,
        trust_type: undefined,
        karta_name: undefined,
        coparceners: undefined,
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
  const category = getEntityCategory(formData.type);

  const renderIndividualFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={(formData as any).date_of_birth || ''}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value || undefined } as any)}
          />
        </div>
        <div className="space-y-2">
          <Label>Nationality</Label>
          <CountrySelect
            value={(formData as any).nationality || ''}
            onValueChange={(value) => setFormData({ ...formData, nationality: value } as any)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tax Residence</Label>
        <CountrySelect
          value={(formData as any).tax_residence || ''}
          onValueChange={(value) => setFormData({ ...formData, tax_residence: value } as any)}
        />
      </div>
    </>
  );

  const renderCoupleFields = () => (
    <>
      <div className="space-y-2">
        <Label>Matrimonial Regime</Label>
        <Select
          value={(formData as any).matrimonial_regime || ''}
          onValueChange={(value) => setFormData({ ...formData, matrimonial_regime: value } as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select regime..." />
          </SelectTrigger>
          <SelectContent>
            {MATRIMONIAL_REGIMES.map((regime) => (
              <SelectItem key={regime.value} value={regime.value}>
                {regime.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marriage_date">Marriage Date</Label>
          <Input
            id="marriage_date"
            type="date"
            value={(formData as any).marriage_date || ''}
            onChange={(e) => setFormData({ ...formData, marriage_date: e.target.value || undefined } as any)}
          />
        </div>
        <div className="space-y-2">
          <Label>Marriage Country</Label>
          <CountrySelect
            value={(formData as any).marriage_country || ''}
            onValueChange={(value) => setFormData({ ...formData, marriage_country: value } as any)}
          />
        </div>
      </div>
    </>
  );

  const renderLegalEntityFields = () => (
    <>
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
          <Label>Legal Form</Label>
          <Select
            value={(formData as any).legal_form || ''}
            onValueChange={(value) => setFormData({ ...formData, legal_form: value } as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select form..." />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_FORMS.map((form) => (
                <SelectItem key={form.value} value={form.value}>
                  {form.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registration_number">Registration #</Label>
          <Input
            id="registration_number"
            value={formData.registration_number || ''}
            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            placeholder="Company number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jurisdiction">Jurisdiction</Label>
          <Input
            id="jurisdiction"
            value={formData.jurisdiction || ''}
            onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
            placeholder="e.g., Delaware, BVI, DMCC"
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
          <Label htmlFor="formation_date">Formation Date</Label>
          <Input
            id="formation_date"
            type="date"
            value={formData.formation_date || ''}
            onChange={(e) => setFormData({ ...formData, formation_date: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="share_capital">Share Capital</Label>
          <Input
            id="share_capital"
            type="number"
            value={(formData as any).share_capital || ''}
            onChange={(e) => setFormData({ ...formData, share_capital: e.target.value ? parseFloat(e.target.value) : undefined } as any)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={(formData as any).share_capital_currency || 'EUR'}
            onValueChange={(value) => setFormData({ ...formData, share_capital_currency: value } as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );

  const renderTrustFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Trust Type</Label>
          <Select
            value={(formData as any).trust_type || ''}
            onValueChange={(value) => setFormData({ ...formData, trust_type: value } as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {filteredTrustTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="trustee_name">Trustee Name</Label>
          <Input
            id="trustee_name"
            value={(formData as any).trustee_name || ''}
            onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value } as any)}
            placeholder="Trustee name"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jurisdiction</Label>
          <CountrySelect
            value={formData.jurisdiction || ''}
            onValueChange={(value) => setFormData({ ...formData, jurisdiction: value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="formation_date">Formation Date</Label>
          <Input
            id="formation_date"
            type="date"
            value={formData.formation_date || ''}
            onChange={(e) => setFormData({ ...formData, formation_date: e.target.value || undefined })}
          />
        </div>
      </div>
    </>
  );

  const renderHUFFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="karta_name">Karta Name</Label>
          <Input
            id="karta_name"
            value={(formData as any).karta_name || ''}
            onChange={(e) => setFormData({ ...formData, karta_name: e.target.value } as any)}
            placeholder="Head of HUF"
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <CountrySelect
            value={formData.country || 'IN'}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="formation_date">Formation Date</Label>
        <Input
          id="formation_date"
          type="date"
          value={formData.formation_date || ''}
          onChange={(e) => setFormData({ ...formData, formation_date: e.target.value || undefined })}
        />
      </div>
    </>
  );

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
                  {filteredEntityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <EntityIcon iconName={type.icon} entityType={type.value} size="sm" />
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dynamic fields based on entity type category */}
          {category === 'individual' && renderIndividualFields()}
          {category === 'relationship' && renderCoupleFields()}
          {category === 'legal_entity' && renderLegalEntityFields()}
          {category === 'trust' && renderTrustFields()}
          {category === 'huf' && renderHUFFields()}
          
          {/* Common fields for non-legal entities */}
          {category !== 'legal_entity' && (
            <div className="space-y-2">
              <Label>Country</Label>
              <CountrySelect
                value={formData.country || ''}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
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