import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Calendar, AlertTriangle, ExternalLink, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document, DOCUMENT_TYPES, getExpiryStatus, useDocumentUpload } from '@/hooks/useDocuments';
import { useAuditLog } from '@/hooks/useAuditLog';
import { SwipeableCard } from '@/components/ui/swipeable-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
  onDelete?: () => void;
  onEdit?: () => void;
  showLink?: boolean;
}

export const DocumentCard = ({ document, onDelete, onEdit, showLink = false }: DocumentCardProps) => {
  const { logEvent } = useAuditLog();
  const { getSignedUrl } = useDocumentUpload();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isMobile = useIsMobile();
  const typeInfo = DOCUMENT_TYPES.find(t => t.value === document.type);
  const expiryStatus = getExpiryStatus(document.expiry_date);
  
  const isPdf = document.file_type === 'application/pdf';

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (document.file_path) {
        try {
          const url = await getSignedUrl(document.file_path);
          setSignedUrl(url);
        } catch (error) {
          console.error('Failed to get signed URL:', error);
        }
      }
    };
    fetchSignedUrl();
  }, [document.file_path, getSignedUrl]);

  const handleDownload = () => {
    if (!signedUrl) return;
    logEvent({
      action: 'download',
      entityType: 'document',
      entityId: document.id,
      metadata: { name: document.name, file_type: document.file_type },
    });
    window.open(signedUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const cardContent = (
    <Card className={cn(
      "p-4 bg-card border-border hover:border-primary/30 transition-colors",
      showPreview && isPdf && "pb-0"
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
          {typeInfo?.icon || '📄'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-foreground truncate">{document.name}</h4>
              <p className="text-sm text-muted-foreground">
                {typeInfo?.label} • {formatFileSize(document.file_size)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {expiryStatus === 'expired' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
              {expiryStatus === 'expiring' && (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
              {document.is_verified && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                  Verified
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {document.document_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(document.document_date), 'MMM d, yyyy')}
              </span>
            )}
            {document.expiry_date && (
              <span className="flex items-center gap-1">
                Expires: {format(new Date(document.expiry_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          
          {document.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {document.notes}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* PDF Preview toggle */}
          {isPdf && signedUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          {/* Desktop-only edit button */}
          {!isMobile && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {/* Desktop-only delete button */}
          {!isMobile && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Inline PDF Preview */}
      {showPreview && isPdf && signedUrl && (
        <div className="mt-4 border-t border-border">
          <iframe
            src={`${signedUrl}#toolbar=0&navpanes=0`}
            className="w-full h-[400px] rounded-b-lg"
            title={`Preview of ${document.name}`}
          />
        </div>
      )}
    </Card>
  );

  // Wrap with SwipeableCard on mobile
  if (isMobile && (onEdit || onDelete)) {
    return (
      <SwipeableCard onEdit={onEdit} onDelete={onDelete}>
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
};
