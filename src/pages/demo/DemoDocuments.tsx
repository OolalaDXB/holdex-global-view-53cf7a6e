import { useState, useMemo } from 'react';
import { Search, FileText, AlertTriangle, Filter, Calendar, ExternalLink, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDemo } from '@/contexts/DemoContext';
import { DOCUMENT_TYPES } from '@/hooks/useDocuments';
import { format } from 'date-fns';

// Demo documents data
const initialDemoDocuments = [
  {
    id: 'doc-1',
    name: 'Titre de propriété Dubai Marina',
    type: 'title_deed',
    file_path: 'demo/title-deed-dubai.pdf',
    file_name: 'title-deed-dubai.pdf',
    file_size: 2500000,
    file_type: 'application/pdf',
    asset_id: 'asset-real-estate-1',
    document_date: '2021-03-15',
    expiry_date: null,
    is_verified: true,
    notes: 'Original title deed from Dubai Land Department',
  },
  {
    id: 'doc-2',
    name: 'Passeport FR',
    type: 'passport',
    file_path: 'demo/passport-fr.pdf',
    file_name: 'passport-fr.pdf',
    file_size: 1200000,
    file_type: 'application/pdf',
    entity_id: 'demo-entity-personal',
    document_date: '2020-05-10',
    expiry_date: '2030-05-10',
    is_verified: true,
    notes: 'French passport',
  },
  {
    id: 'doc-3',
    name: 'Assurance Porsche',
    type: 'insurance',
    file_path: 'demo/insurance-porsche.pdf',
    file_name: 'insurance-porsche.pdf',
    file_size: 850000,
    file_type: 'application/pdf',
    collection_id: 'collection-vehicle-1',
    document_date: '2024-01-15',
    expiry_date: '2025-03-15',
    is_verified: false,
    notes: 'Comprehensive coverage, Portugal',
  },
];

type FilterType = 'all' | 'expiring' | 'expired' | string;

const getExpiryStatus = (expiryDate: string | null): 'expired' | 'expiring' | 'valid' | null => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expiry < now) return 'expired';
  if (expiry <= thirtyDaysFromNow) return 'expiring';
  return 'valid';
};

const DemoDocuments = () => {
  const { assets, collections, entities } = useDemo();
  const [documents, setDocuments] = useState(initialDemoDocuments);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  const getLinkName = (doc: typeof documents[0]): string => {
    if (doc.asset_id) {
      const asset = assets.find(a => a.id === doc.asset_id);
      return asset?.name || 'Unknown Asset';
    }
    if (doc.collection_id) {
      const collection = collections.find(c => c.id === doc.collection_id);
      return collection?.name || 'Unknown Collection';
    }
    if (doc.entity_id) {
      const entity = entities.find(e => e.id === doc.entity_id);
      return entity?.name || 'Unknown Entity';
    }
    return 'Unlinked';
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter === 'expiring') return getExpiryStatus(doc.expiry_date) === 'expiring';
      if (typeFilter === 'expired') return getExpiryStatus(doc.expiry_date) === 'expired';
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      return true;
    });
  }, [documents, search, typeFilter]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const expiringCount = documents.filter(d => getExpiryStatus(d.expiry_date) === 'expiring').length;

  return (
    <AppLayout isDemo>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary text-center">Demo Mode — Sample documents</p>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-light text-foreground mb-2">Documents</h1>
          <p className="text-muted-foreground">Proof and certificates linked to your assets</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
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
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.icon} {type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const typeInfo = DOCUMENT_TYPES.find(t => t.value === doc.type);
            const expiryStatus = getExpiryStatus(doc.expiry_date);
            return (
              <Card key={doc.id} className="p-4 bg-card border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">{typeInfo?.icon || '📄'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-foreground">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">{typeInfo?.label} • {formatFileSize(doc.file_size)} • {getLinkName(doc)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {expiryStatus === 'expiring' && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">Expiring Soon</Badge>
                        )}
                        {doc.is_verified && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-500">Verified</Badge>
                        )}
                      </div>
                    </div>
                    {doc.expiry_date && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default DemoDocuments;
