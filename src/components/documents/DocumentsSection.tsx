import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentCard } from './DocumentCard';
import { AddDocumentDialog } from './AddDocumentDialog';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { useDocuments, Document } from '@/hooks/useDocuments';

interface DocumentsSectionProps {
  linkType: 'asset' | 'collection' | 'liability' | 'entity' | 'receivable';
  linkId: string;
  maxDocuments?: number;
}

export const DocumentsSection = ({ linkType, linkId, maxDocuments = 10 }: DocumentsSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const filterKey = `${linkType}Id` as const;
  const filters = {
    assetId: linkType === 'asset' ? linkId : undefined,
    collectionId: linkType === 'collection' ? linkId : undefined,
    liabilityId: linkType === 'liability' ? linkId : undefined,
    entityId: linkType === 'entity' ? linkId : undefined,
    receivableId: linkType === 'receivable' ? linkId : undefined,
  };

  const { data: documents = [], isLoading } = useDocuments(filters);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Documents</h3>
          <span className="text-sm text-muted-foreground">
            ({documents.length}/{maxDocuments})
          </span>
        </div>
        
        {documents.length < maxDocuments && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Document
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No documents yet</p>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => setShowAddDialog(true)}
          >
            Add your first document
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={() => setDocumentToDelete(doc)}
            />
          ))}
        </div>
      )}

      <AddDocumentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        linkType={linkType}
        linkId={linkId}
        currentCount={documents.length}
        maxCount={maxDocuments}
      />

      <DeleteDocumentDialog
        document={documentToDelete}
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      />
    </div>
  );
};
