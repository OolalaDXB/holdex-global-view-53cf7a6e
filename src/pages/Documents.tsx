import { useState, useMemo } from 'react';
import { Search, FileText, AlertTriangle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { useAllDocuments, DOCUMENT_TYPES, getExpiryStatus, Document } from '@/hooks/useDocuments';
import { useAssets } from '@/hooks/useAssets';
import { useCollections } from '@/hooks/useCollections';
import { useLiabilities } from '@/hooks/useLiabilities';
import { useEntities } from '@/hooks/useEntities';
import { useReceivables } from '@/hooks/useReceivables';

type FilterType = 'all' | 'expiring' | 'expired' | string;

const Documents = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

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
    return documents.filter((doc) => {
      // Search filter
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter === 'expiring') {
        return getExpiryStatus(doc.expiry_date) === 'expiring';
      }
      if (typeFilter === 'expired') {
        return getExpiryStatus(doc.expiry_date) === 'expired';
      }
      if (typeFilter !== 'all' && doc.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [documents, search, typeFilter]);

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
  }, [filteredDocuments, assets, collections, liabilities, entities, receivables]);

  const expiringCount = documents.filter(d => getExpiryStatus(d.expiry_date) === 'expiring').length;
  const expiredCount = documents.filter(d => getExpiryStatus(d.expiry_date) === 'expired').length;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light text-foreground mb-2">Documents</h1>
          <p className="text-muted-foreground">
            Proof and certificates linked to your assets
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-light text-foreground">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </Card>
          
          {expiringCount > 0 && (
            <Card className="p-4 bg-card border-orange-500/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-light text-foreground">{expiringCount}</p>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </Card>
          )}
          
          {expiredCount > 0 && (
            <Card className="p-4 bg-card border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-2xl font-light text-foreground">{expiredCount}</p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expiring">
                <span className="text-orange-500">Expiring Soon</span>
              </SelectItem>
              <SelectItem value="expired">
                <span className="text-destructive">Expired</span>
              </SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {documents.length === 0
                ? 'No documents yet. Add documents from your assets or collections.'
                : 'No documents match your filters.'}
            </p>
          </div>
        ) : (
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
        )}

        <DeleteDocumentDialog
          document={documentToDelete}
          open={!!documentToDelete}
          onOpenChange={(open) => !open && setDocumentToDelete(null)}
        />
      </div>
    </AppLayout>
  );
};

export default Documents;
