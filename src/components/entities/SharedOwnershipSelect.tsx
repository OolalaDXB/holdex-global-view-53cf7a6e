import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { User, Plus, Users } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  ownership_percentage?: number | null;
}

interface OwnershipAllocation {
  entity_id: string;
  percentage: number;
}

interface SharedOwnershipSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: Entity[];
  personalEntity: Entity | null;
  onSave: (allocation: OwnershipAllocation[]) => void;
  onCreateEntity?: (entity: { name: string; type: string; country: string }) => Promise<string>;
  currentAllocation?: OwnershipAllocation[];
}

const QUICK_ENTITY_TYPES = [
  { value: 'partner', label: 'Partner', color: '#9B6B6B' },
  { value: 'couple', label: 'Couple (joint)', color: '#7D8B75' },
];

export const SharedOwnershipSelect = ({
  open,
  onOpenChange,
  entities,
  personalEntity,
  onSave,
  onCreateEntity,
  currentAllocation,
}: SharedOwnershipSelectProps) => {
  // Get partner/couple entities that can share ownership
  const shareableEntities = useMemo(() => {
    return entities.filter(e => ['partner', 'spouse', 'couple'].includes(e.type));
  }, [entities]);

  // Initialize allocation from current or default 50/50
  const [myPercentage, setMyPercentage] = useState<number>(() => {
    if (currentAllocation && currentAllocation.length > 0) {
      const myAlloc = currentAllocation.find(a => a.entity_id === personalEntity?.id);
      return myAlloc?.percentage || 50;
    }
    return 50;
  });
  
  // Local input state for controlled input without resetting on each keystroke
  const [percentageInput, setPercentageInput] = useState<string>(myPercentage.toString());

  const [partnerEntityId, setPartnerEntityId] = useState<string | null>(() => {
    if (currentAllocation && currentAllocation.length > 0) {
      const partnerAlloc = currentAllocation.find(a => a.entity_id !== personalEntity?.id);
      return partnerAlloc?.entity_id || null;
    }
    return shareableEntities[0]?.id || null;
  });

  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'partner', country: '' });
  const [isCreating, setIsCreating] = useState(false);

  const partnerPercentage = 100 - myPercentage;

  const handleSave = () => {
    if (!personalEntity || !partnerEntityId) return;

    const allocation: OwnershipAllocation[] = [
      { entity_id: personalEntity.id, percentage: myPercentage },
      { entity_id: partnerEntityId, percentage: partnerPercentage },
    ];

    onSave(allocation);
    onOpenChange(false);
  };

  const handleCreatePartner = async () => {
    if (!newPartner.name.trim() || !onCreateEntity) return;
    
    setIsCreating(true);
    try {
      const newId = await onCreateEntity({
        name: newPartner.name.trim(),
        type: newPartner.type,
        country: newPartner.country,
      });
      
      setPartnerEntityId(newId);
      setShowCreatePartner(false);
      setNewPartner({ name: '', type: 'partner', country: '' });
    } catch (error) {
      console.error('Failed to create partner:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedPartner = entities.find(e => e.id === partnerEntityId);

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
                  min="0"
                  max="100"
                  value={percentageInput}
                  onChange={(e) => setPercentageInput(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(percentageInput);
                    if (!isNaN(parsed)) {
                      const clamped = Math.min(100, Math.max(0, parsed));
                      setMyPercentage(clamped);
                      setPercentageInput(clamped.toString());
                    } else {
                      setPercentageInput(myPercentage.toString());
                    }
                  }}
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
                  onValueChange={setPartnerEntityId}
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

        {/* Handle create-new selection */}
        {partnerEntityId === 'create-new' && (
          <Dialog open={true} onOpenChange={() => setPartnerEntityId(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Add Partner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="partner-name">Name</Label>
                  <Input
                    id="partner-name"
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
                    value={newPartner.country}
                    onValueChange={(v) => setNewPartner({ ...newPartner, country: v })}
                    placeholder="Select country"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreatePartner}
                    disabled={!newPartner.name.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPartnerEntityId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Direct create partner dialog */}
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
                    value={newPartner.country}
                    onValueChange={(v) => setNewPartner({ ...newPartner, country: v })}
                    placeholder="Select country"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreatePartner}
                    disabled={!newPartner.name.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
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

// Helper to format ownership allocation for display
export const formatOwnershipAllocation = (
  allocation: OwnershipAllocation[] | null | undefined,
  entities: Entity[]
): string | null => {
  if (!allocation || allocation.length < 2) return null;

  // Sort by percentage descending
  const sorted = [...allocation].sort((a, b) => b.percentage - a.percentage);
  
  // Check if it's a simple split (e.g., 50/50, 70/30)
  if (sorted.length === 2) {
    return `${sorted[0].percentage}/${sorted[1].percentage}`;
  }

  // For more complex allocations, show all percentages
  return sorted.map(a => `${a.percentage}%`).join(' · ');
};

// Get partner name from allocation
export const getPartnerFromAllocation = (
  allocation: OwnershipAllocation[] | null | undefined,
  entities: Entity[],
  personalEntityId: string | null
): string | null => {
  if (!allocation || allocation.length < 2) return null;

  const partnerAlloc = allocation.find(a => a.entity_id !== personalEntityId);
  if (!partnerAlloc) return null;

  const partner = entities.find(e => e.id === partnerAlloc.entity_id);
  return partner?.name || null;
};
