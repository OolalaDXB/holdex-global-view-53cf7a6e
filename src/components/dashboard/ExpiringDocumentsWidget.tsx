import { Link } from 'react-router-dom';
import { FileWarning, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAllDocuments, getExpiryStatus, DOCUMENT_TYPES } from '@/hooks/useDocuments';

export function ExpiringDocumentsWidget() {
  const { data: documents = [] } = useAllDocuments();

  const expiringDocs = documents.filter(doc => {
    const status = getExpiryStatus(doc.expiry_date);
    return status === 'expired' || status === 'expiring';
  });

  const expiredCount = expiringDocs.filter(doc => getExpiryStatus(doc.expiry_date) === 'expired').length;
  const expiringCount = expiringDocs.filter(doc => getExpiryStatus(doc.expiry_date) === 'expiring').length;

  if (expiringDocs.length === 0) return null;

  const getDocIcon = (type: string) => {
    const docType = DOCUMENT_TYPES.find(t => t.value === type);
    return docType?.icon || '📄';
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileWarning size={16} className="text-warning" />
          <h4 className="font-medium text-sm">Document Alerts</h4>
        </div>
        <Link 
          to="/documents" 
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight size={12} />
        </Link>
      </div>
      
      <div className="flex gap-4 mb-3">
        {expiredCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-destructive font-medium">{expiredCount} expired</span>
          </div>
        )}
        {expiringCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-warning font-medium">{expiringCount} expiring soon</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {expiringDocs.slice(0, 3).map(doc => {
          const status = getExpiryStatus(doc.expiry_date);
          return (
            <div 
              key={doc.id} 
              className="flex items-center gap-2 text-xs p-2 rounded bg-secondary/50"
            >
              <span>{getDocIcon(doc.type)}</span>
              <span className="flex-1 truncate">{doc.name}</span>
              {status === 'expired' ? (
                <AlertTriangle size={12} className="text-destructive" />
              ) : (
                <AlertTriangle size={12} className="text-warning" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
