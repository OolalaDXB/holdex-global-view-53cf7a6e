import { format } from 'date-fns';
import { FileText, Calendar, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document, DOCUMENT_TYPES, getExpiryStatus } from '@/hooks/useDocuments';
import { useAuditLog } from '@/hooks/useAuditLog';

interface DocumentCardProps {
  document: Document;
  onDelete?: () => void;
  showLink?: boolean;
}

export const DocumentCard = ({ document, onDelete, showLink = false }: DocumentCardProps) => {
  const { logEvent } = useAuditLog();
  const typeInfo = DOCUMENT_TYPES.find(t => t.value === document.type);
  const expiryStatus = getExpiryStatus(document.expiry_date);

  const handleDownload = () => {
    logEvent({
      action: 'download',
      entityType: 'document',
      entityId: document.id,
      metadata: { name: document.name, file_type: document.file_type },
    });
    window.open(document.file_url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/30 transition-colors">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          {onDelete && (
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
    </Card>
  );
};
