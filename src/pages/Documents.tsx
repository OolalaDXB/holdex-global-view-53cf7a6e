import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Search, FileText, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { AddStandaloneDocumentDialog } from '@/components/documents/AddStandaloneDocumentDialog';
import { useAllDocuments, DOCUMENT_TYPES, getExpiryStatus, Document } from '@/hooks/useDocuments';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useReceivables } from '@/hooks/useReceivables';

type FilterType = 'all' | 'expiring' | 'expired' | string;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Documents' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  ...DOCUMENT_TYPES.map(type => ({ value: type.value, label: type.label })),
];

const Documents = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: documents = [], isLoading } = useAllDocuments();
  const { data: assets = [] } = useAssets();
  const { data: collections = [] } = useCollections();
  const { data: liabilities = [] } = useLiabilities();
  const { data: entities = [] } = useEntities();
  const { data: receivables = [] } = useReceivables();

  const getLinkName = (doc: Document): string => {
    if (doc.asset_id) {
      const asset = assets.find(a => a.id === doc.asset_id);
      return asset?.name || 'Unknown Asset';
    }
    if (doc.collection_id) {
      const collection = collections.find(c => c.id === doc.collection_id);
      return collection?.name || 'Unknown Collection';
    }
    if (doc.liability_id) {
      const liability = liabilities.find(l => l.id === doc.liability_id);
      return liability?.name || 'Unknown Liability';
    }
    if (doc.entity_id) {
      const entity = entities.find(e => e.id === doc.entity_id);
      return entity?.name || 'Unknown Entity';
    }
    if (doc.receivable_id) {
      const receivable = receivables.find(r => r.id === doc.receivable_id);
      return receivable?.name || 'Unknown Receivable';
    }
    return 'Unlinked';
  };

  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Type filter
        if (filter === 'expiring') {
          return getExpiryStatus(doc.expiry_date) === 'expiring';
        }
        if (filter === 'expired') {
          return getExpiryStatus(doc.expiry_date) === 'expired';
        }
        if (filter !== 'all' && doc.type !== filter) {
          return false;
        }
        return true;
      })
      .filter((doc) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const linkName = getLinkName(doc);
        return (
          doc.name.toLowerCase().includes(query) ||
          doc.file_name.toLowerCase().includes(query) ||
          linkName.toLowerCase().includes(query)
        );
      });
  }, [documents, filter, searchQuery, assets, collections, liabilities, entities, receivables]);

  // Group documents by linked item
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, { name: string; documents: Document[] }> = {};
    
    filteredDocuments.forEach((doc) => {
      const linkId = doc.asset_id || doc.collection_id || doc.liability_id || doc.entity_id || doc.receivable_id || 'unlinked';
      const linkName = getLinkName(doc);
      
      if (!groups[linkId]) {
        groups[linkId] = { name: linkName, documents: [] };
      }
      groups[linkId].documents.push(doc);
    });

    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filteredDocuments]);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-12 max-w-7xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Documents</h1>
            <p className="text-muted-foreground">Proof and certificates linked to your assets.</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Document
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                  filter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent",
                  option.value === 'expiring' && "text-orange-500",
                  option.value === 'expired' && "text-destructive"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : (
          <>
            {/* Documents List */}
            {filteredDocuments.length > 0 ? (
              <div className="space-y-6">
                {groupedDocuments.map(([linkId, group]) => (
                  <div key={linkId}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {group.name}
                    </h3>
                    <div className="space-y-2">
                      {group.documents.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onDelete={() => setDocumentToDelete(doc)}
                          showLink
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {documents.length === 0
                    ? 'No documents yet. Add documents from your assets or collections.'
                    : searchQuery
                      ? `No documents found matching "${searchQuery}".`
                      : 'No documents found in this category.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <DeleteDocumentDialog
        document={documentToDelete}
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      />

      <AddStandaloneDocumentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </AppLayout>
  );
};

export default Documents;