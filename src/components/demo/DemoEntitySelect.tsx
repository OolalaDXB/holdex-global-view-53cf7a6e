import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelect } from '@/components/ui/country-select';
import { useDemo } from '@/contexts/DemoContext';
import { User, Plus, Users } from 'lucide-react';

const QUICK_ENTITY_TYPES = [
  { value: 'partner', label: 'Partner', color: '#9B6B6B' },
  { value: 'couple', label: 'Couple (joint)', color: '#7D8B75' },
  { value: 'company', label: 'Company', color: '#6B7B9B' },
  { value: 'holding', label: 'Holding', color: '#8B7B6B' },
  { value: 'trust', label: 'Trust', color: '#6B8B7B' },
];

interface OwnershipAllocation {
  entity_id: string;
  percentage: number;
}

interface DemoEntitySelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  ownershipAllocation?: OwnershipAllocation[] | null;
  onOwnershipAllocationChange?: (allocation: OwnershipAllocation[] | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const DemoEntitySelect = ({
  value,
  onChange,
  ownershipAllocation,
  onOwnershipAllocationChange,
  className,
  placeholder = 'Select owner',
  disabled,
}: DemoEntitySelectProps) => {
  const { entities, addEntity } = useDemo();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSharedDialog, setShowSharedDialog] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', type: 'partner', country: '' });

  // Find personal entity and sort entities for better UX
  const { personalEntity, otherEntities, shareableEntities } = useMemo(() => {
    const personal = entities.find(e => e.type === 'personal');
    const others = entities.filter(e => e.type !== 'personal');
    const shareable = entities.filter(e => ['partner', 'spouse', 'couple'].includes(e.type));
    
    return { personalEntity: personal, otherEntities: others, shareableEntities: shareable };
  }, [entities]);

  const handleCreateEntity = () => {
    if (!newEntity.name.trim()) return;
    
    const typeInfo = QUICK_ENTITY_TYPES.find(t => t.value === newEntity.type);
    const newId = addEntity({
      name: newEntity.name.trim(),
      type: newEntity.type,
      country: newEntity.country || null,
      color: typeInfo?.color || '#C4785A',
      icon: newEntity.type === 'partner' ? 'UserCircle' : 'Building2',
      legal_name: null,
      registration_number: null,
      jurisdiction: null,
      is_active: true,
      formation_date: null,
      dissolution_date: null,
      owned_by_entity_id: personalEntity?.id || null,
      ownership_percentage: 100,
      notes: null,
    });
    
    onChange(newId);
    setShowCreateDialog(false);
    setNewEntity({ name: '', type: 'partner', country: '' });
  };

  // Check if currently showing shared ownership
  const isSharedOwnership = ownershipAllocation && ownershipAllocation.length >= 2;

  // Get display name for selected value
  const getSelectedDisplay = () => {
    // If shared ownership is set, show the allocation
    if (isSharedOwnership) {
      const partnerAlloc = ownershipAllocation?.find(a => a.entity_id !== personalEntity?.id);
      const myAlloc = ownershipAllocation?.find(a => a.entity_id === personalEntity?.id);
      const partner = entities.find(e => e.id === partnerAlloc?.entity_id);
      
      if (myAlloc && partnerAlloc) {
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-positive" />
            <span>Shared {myAlloc.percentage}/{partnerAlloc.percentage}</span>
            {partner && <span className="text-muted-foreground text-xs">with {partner.name}</span>}
          </div>
        );
      }
    }

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

  const handleValueChange = (v: string) => {
    if (v === 'create-new') {
      setShowCreateDialog(true);
    } else if (v === 'shared') {
      setShowSharedDialog(true);
    } else {
      onChange(v === 'none' ? null : v);
      // Clear ownership allocation when selecting a single entity
      if (onOwnershipAllocationChange && v !== 'shared') {
        onOwnershipAllocationChange(null);
      }
    }
  };

  return (
    <>
      <Select
        value={isSharedOwnership ? 'shared' : (value || 'none')}
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
          
          {/* Shared ownership option */}
          <div className="h-px bg-border my-1" />
          <SelectItem value="shared">
            <div className="flex items-center gap-2 text-positive">
              <Users className="h-4 w-4" />
              <span>Shared...</span>
            </div>
          </SelectItem>
          
          {/* Create new option */}
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

      {/* Shared Ownership Dialog */}
      <DemoSharedOwnershipDialog
        open={showSharedDialog}
        onOpenChange={setShowSharedDialog}
        entities={entities}
        personalEntity={personalEntity || null}
        shareableEntities={shareableEntities}
        onSave={(allocation) => {
          if (personalEntity) {
            onChange(personalEntity.id);
          }
          if (onOwnershipAllocationChange) {
            onOwnershipAllocationChange(allocation);
          }
        }}
        onCreateEntity={(entity) => {
          const typeInfo = QUICK_ENTITY_TYPES.find(t => t.value === entity.type);
          return addEntity({
            name: entity.name,
            type: entity.type,
            country: entity.country || null,
            color: typeInfo?.color || '#9B6B6B',
            icon: 'UserCircle',
            legal_name: null,
            registration_number: null,
            jurisdiction: null,
            is_active: true,
            formation_date: null,
            dissolution_date: null,
            owned_by_entity_id: personalEntity?.id || null,
            ownership_percentage: 100,
            notes: null,
          });
        }}
        currentAllocation={ownershipAllocation || undefined}
      />

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
                disabled={!newEntity.name.trim()}
                className="flex-1"
              >
                Create & Select
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

// Demo Shared Ownership Dialog Component
interface DemoEntity {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  ownership_percentage?: number | null;
}

interface DemoSharedOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: DemoEntity[];
  personalEntity: DemoEntity | null;
  shareableEntities: DemoEntity[];
  onSave: (allocation: OwnershipAllocation[]) => void;
  onCreateEntity: (entity: { name: string; type: string; country: string }) => string;
  currentAllocation?: OwnershipAllocation[];
}

const DemoSharedOwnershipDialog = ({
  open,
  onOpenChange,
  entities,
  personalEntity,
  shareableEntities,
  onSave,
  onCreateEntity,
  currentAllocation,
}: DemoSharedOwnershipDialogProps) => {
  const [myPercentage, setMyPercentage] = useState(() => {
    if (currentAllocation && currentAllocation.length > 0) {
      const myAlloc = currentAllocation.find(a => a.entity_id === personalEntity?.id);
      return myAlloc?.percentage || 50;
    }
    return 50;
  });

  const [partnerEntityId, setPartnerEntityId] = useState<string | null>(() => {
    if (currentAllocation && currentAllocation.length > 0) {
      const partnerAlloc = currentAllocation.find(a => a.entity_id !== personalEntity?.id);
      return partnerAlloc?.entity_id || null;
    }
    return shareableEntities[0]?.id || null;
  });

  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'partner', country: '' });

  const partnerPercentage = 100 - myPercentage;
  const selectedPartner = entities.find(e => e.id === partnerEntityId);

  const handleSave = () => {
    if (!personalEntity || !partnerEntityId) return;

    const allocation: OwnershipAllocation[] = [
      { entity_id: personalEntity.id, percentage: myPercentage },
      { entity_id: partnerEntityId, percentage: partnerPercentage },
    ];

    onSave(allocation);
    onOpenChange(false);
  };

  const handleCreatePartner = () => {
    if (!newPartner.name.trim()) return;
    
    const newId = onCreateEntity({
      name: newPartner.name.trim(),
      type: newPartner.type,
      country: newPartner.country,
    });
    
    setPartnerEntityId(newId);
    setShowCreatePartner(false);
    setNewPartner({ name: '', type: 'partner', country: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Shared Ownership
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* My Share */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">My share</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 p-3 rounded-md bg-accent/50">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Personal (me)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={myPercentage}
                  onChange={(e) => setMyPercentage(Math.min(99, Math.max(1, parseInt(e.target.value) || 50)))}
                  className="w-20 text-center"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Partner Share */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Partner's share</Label>
            <div className="flex items-center gap-3">
              {shareableEntities.length > 0 ? (
                <Select
                  value={partnerEntityId || ''}
                  onValueChange={(v) => {
                    if (v === 'create-new') {
                      setShowCreatePartner(true);
                    } else {
                      setPartnerEntityId(v);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareableEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entity.color || '#9B6B6B' }}
                          />
                          <span>{entity.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <SelectItem value="create-new">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="h-4 w-4" />
                        <span>Add partner...</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-start text-muted-foreground"
                  onClick={() => setShowCreatePartner(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add partner...
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={partnerPercentage}
                  disabled
                  className="w-20 text-center bg-muted"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Visual representation */}
          <div className="space-y-2">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary transition-all"
                style={{ width: `${myPercentage}%` }}
              />
              <div 
                className="bg-positive transition-all"
                style={{ width: `${partnerPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Me: {myPercentage}%</span>
              <span>{selectedPartner?.name || 'Partner'}: {partnerPercentage}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleSave}
              disabled={!partnerEntityId}
              className="flex-1"
            >
              Save Allocation
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Create Partner Dialog */}
        {showCreatePartner && (
          <Dialog open={showCreatePartner} onOpenChange={setShowCreatePartner}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Add Partner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-partner-name">Name</Label>
                  <Input
                    id="new-partner-name"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    placeholder="e.g., Darya"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newPartner.type}
                    onValueChange={(v) => setNewPartner({ ...newPartner, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="couple">Couple (joint)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Country (optional)</Label>
                  <CountrySelect
                    value={newPartner.country}
                    onValueChange={(v) => setNewPartner({ ...newPartner, country: v })}
                    placeholder="Select country"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreatePartner}
                    disabled={!newPartner.name.trim()}
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreatePartner(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
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
