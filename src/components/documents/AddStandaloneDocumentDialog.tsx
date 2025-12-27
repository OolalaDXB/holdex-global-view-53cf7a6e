import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateDocument, useDocumentUpload, DOCUMENT_TYPES } from '@/hooks/useDocuments';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useReceivables } from '@/hooks/useReceivables';

interface AddStandaloneDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LinkType = 'asset' | 'collection' | 'liability' | 'entity' | 'receivable';

export const AddStandaloneDocumentDialog = ({
  open,
  onOpenChange,
}: AddStandaloneDocumentDialogProps) => {
  const { toast } = useToast();
  const createDocument = useCreateDocument();
  const { uploadDocument } = useDocumentUpload();
  
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: entities = [] } = useEntities();
  const { data: receivables = [] } = useReceivables();
  
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('other');
  const [documentDate, setDocumentDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('asset');
  const [linkId, setLinkId] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const resetForm = () => {
    setFile(null);
    setName('');
    setType('other');
    setDocumentDate('');
    setExpiryDate('');
    setNotes('');
    setLinkType('asset');
    setLinkId('');
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    if (!linkId) {
      toast({ title: 'Please select an item to link', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      const documentId = crypto.randomUUID();
      const fileUrl = await uploadDocument(file, documentId);

      const linkField = {
        asset_id: linkType === 'asset' ? linkId : null,
        collection_id: linkType === 'collection' ? linkId : null,
        liability_id: linkType === 'liability' ? linkId : null,
        entity_id: linkType === 'entity' ? linkId : null,
        receivable_id: linkType === 'receivable' ? linkId : null,
      };

      await createDocument.mutateAsync({
        name: name || file.name,
        type,
        file_path: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        document_date: documentDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        ...linkField,
      });

      toast({ title: 'Document uploaded successfully' });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const linkOptions = getLinkOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, WebP • Max 10MB
                </p>
              </>
            )}
          </div>

          {/* Link To */}
          <div className="space-y-2">
            <Label>Link To</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={linkType} onValueChange={(v) => { setLinkType(v as LinkType); setLinkId(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="entity">Entity</SelectItem>
                  <SelectItem value="receivable">Receivable</SelectItem>
                </SelectContent>
              </Select>
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {linkOptions.length === 0 ? (
                    <SelectItem value="" disabled>No items available</SelectItem>
                  ) : (
                    linkOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Title Deed - Dubai Marina"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    {docType.icon} {docType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentDate">Document Date</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || !linkId || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
