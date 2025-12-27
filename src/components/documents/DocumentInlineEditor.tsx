import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Check, Plus, CalendarIcon, ShieldCheck, ShieldOff, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DocumentTagBadge, SUGGESTED_TAGS } from './DocumentTagBadge';
import { DocumentTypeIcon } from './DocumentTypeIcon';
import { DOCUMENT_TYPES } from '@/hooks/useDocuments';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useReceivables } from '@/hooks/useReceivables';
import { cn } from '@/lib/utils';

type LinkType = 'asset' | 'collection' | 'liability' | 'entity' | 'receivable' | 'none';

interface DocumentInlineEditorProps {
  name: string;
  type: string;
  notes: string | null;
  expiryDate: string | null;
  documentDate: string | null;
  tags: string[] | null;
  isVerified: boolean;
  assetId: string | null;
  collectionId: string | null;
  liabilityId: string | null;
  entityId: string | null;
  receivableId: string | null;
  onSave: (data: { 
    name: string; 
    type: string;
    notes: string | null; 
    expiry_date: string | null; 
    document_date: string | null;
    tags: string[] | null;
    is_verified: boolean;
    asset_id: string | null;
    collection_id: string | null;
    liability_id: string | null;
    entity_id: string | null;
    receivable_id: string | null;
  }) => void;
  onCancel: () => void;
}

export const DocumentInlineEditor = ({
  name: initialName,
  type: initialType,
  notes: initialNotes,
  expiryDate: initialExpiryDate,
  documentDate: initialDocumentDate,
  tags: initialTags,
  isVerified: initialIsVerified,
  assetId: initialAssetId,
  collectionId: initialCollectionId,
  liabilityId: initialLiabilityId,
  entityId: initialEntityId,
  receivableId: initialReceivableId,
  onSave,
  onCancel,
}: DocumentInlineEditorProps) => {
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: entities = [] } = useEntities();
  const { data: receivables = [] } = useReceivables();

  // Determine initial link type
  const getInitialLinkType = (): LinkType => {
    if (initialAssetId) return 'asset';
    if (initialCollectionId) return 'collection';
    if (initialLiabilityId) return 'liability';
    if (initialEntityId) return 'entity';
    if (initialReceivableId) return 'receivable';
    return 'none';
  };

  const getInitialLinkId = (): string => {
    return initialAssetId || initialCollectionId || initialLiabilityId || initialEntityId || initialReceivableId || '';
  };

  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [notes, setNotes] = useState(initialNotes || '');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    initialExpiryDate ? new Date(initialExpiryDate) : undefined
  );
  const [documentDate, setDocumentDate] = useState<Date | undefined>(
    initialDocumentDate ? new Date(initialDocumentDate) : undefined
  );
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [linkType, setLinkType] = useState<LinkType>(getInitialLinkType());
  const [linkId, setLinkId] = useState<string>(getInitialLinkId());
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const getLinkOptions = () => {
    switch (linkType) {
      case 'asset':
        return assets.map(a => ({ id: a.id, name: a.name }));
      case 'collection':
        return collections.map(c => ({ id: c.id, name: c.name }));
      case 'liability':
        return liabilities.map(l => ({ id: l.id, name: l.name }));
      case 'entity':
        return entities.map(e => ({ id: e.id, name: e.name }));
      case 'receivable':
        return receivables.map(r => ({ id: r.id, name: r.name }));
      default:
        return [];
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      notes: notes.trim() || null,
      expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null,
      document_date: documentDate ? format(documentDate, 'yyyy-MM-dd') : null,
      tags: tags.length > 0 ? tags : null,
      is_verified: isVerified,
      asset_id: linkType === 'asset' ? linkId : null,
      collection_id: linkType === 'collection' ? linkId : null,
      liability_id: linkType === 'liability' ? linkId : null,
      entity_id: linkType === 'entity' ? linkId : null,
      receivable_id: linkType === 'receivable' ? linkId : null,
    });
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleLinkTypeChange = (newLinkType: string) => {
    setLinkType(newLinkType as LinkType);
    setLinkId('');
  };

  const linkOptions = getLinkOptions();

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border" onClick={e => e.stopPropagation()}>
      {/* Name */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
        <Input
          ref={nameInputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8"
          placeholder="Document name"
        />
      </div>

      {/* Type */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8">
            <SelectValue>
              <div className="flex items-center gap-2">
                <DocumentTypeIcon type={type} className="w-4 h-4" />
                {DOCUMENT_TYPES.find(t => t.value === type)?.label || type}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((docType) => (
              <SelectItem key={docType.value} value={docType.value}>
                <div className="flex items-center gap-2">
                  <DocumentTypeIcon type={docType.value} className="w-4 h-4" />
                  {docType.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Link To */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
          <Link2 className="w-3 h-3" />
          Linked To
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={linkType} onValueChange={handleLinkTypeChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
              <SelectItem value="entity">Entity</SelectItem>
              <SelectItem value="receivable">Receivable</SelectItem>
            </SelectContent>
          </Select>
          {linkType !== 'none' && (
            <Select value={linkId} onValueChange={setLinkId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {linkOptions.length === 0 ? (
                  <SelectItem value="" disabled>No items</SelectItem>
                ) : (
                  linkOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <DocumentTagBadge
              key={tag}
              tag={tag}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
          {showTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTag);
                  }
                  if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setNewTag('');
                  }
                }}
                className="h-6 w-24 text-xs"
                placeholder="New tag..."
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleAddTag(newTag)}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowTagInput(false);
                  setNewTag('');
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-5 text-xs px-2 gap-1"
              onClick={() => setShowTagInput(true)}
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          )}
        </div>
        {/* Suggested tags */}
        {tags.length < 5 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 5).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted hover:bg-accent transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Document Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal text-xs",
                  !documentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {documentDate ? format(documentDate, 'MMM d, yyyy') : 'Select'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={documentDate}
                onSelect={setDocumentDate}
                initialFocus
              />
              {documentDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setDocumentDate(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Expiry Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal text-xs",
                  !expiryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {expiryDate ? format(expiryDate, 'MMM d, yyyy') : 'Select'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={expiryDate}
                onSelect={setExpiryDate}
                initialFocus
              />
              {expiryDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setExpiryDate(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Verified toggle */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Verification Status</Label>
        <Button
          type="button"
          variant={isVerified ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2",
            isVerified && "bg-green-600 hover:bg-green-700"
          )}
          onClick={() => setIsVerified(!isVerified)}
        >
          {isVerified ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verified
            </>
          ) : (
            <>
              <ShieldOff className="w-4 h-4" />
              Not Verified
            </>
          )}
        </Button>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
          placeholder="Add notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
};
