import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLiabilities, Liability, LIABILITY_TYPES, getLiabilityTypeInfo } from '@/hooks/useLiabilities';
import { useLoanSchedule } from '@/hooks/useLoanSchedules';
import { LoanScheduleSection } from '@/components/liabilities/LoanScheduleSection';
import { MonthlyPaymentSummary } from '@/components/liabilities/MonthlyPaymentSummary';
import { LoanComparisonTool } from '@/components/liabilities/LoanComparisonTool';
import { LiabilityDialog } from '@/components/liabilities/LiabilityDialog';
import { DeleteLiabilityDialog } from '@/components/liabilities/DeleteLiabilityDialog';
import { DocumentsSection } from '@/components/documents/DocumentsSection';
import { LiabilityIcon } from '@/components/liabilities/LiabilityIcon';
import { LiabilityBreakdownChart } from '@/components/liabilities/LiabilityBreakdownChart';
import { formatCurrency } from '@/lib/currency';
import { getCountryFlag } from '@/hooks/useCountries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CertaintyBadge } from '@/components/ui/certainty-badge';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, Search, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CertaintyFilter = 'all' | 'certain' | 'exclude-optional';
type TypeFilter = 'all' | string;

function LiabilityCard({ 
  liability, 
  onEdit, 
  onDelete 
}: { 
  liability: Liability;
  onEdit: (liability: Liability) => void;
  onDelete: (liability: Liability) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: schedule } = useLoanSchedule(liability.id);
  const typeInfo = getLiabilityTypeInfo(liability.type);
  
  return (
    <Card className="bg-card border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LiabilityIcon type={liability.type} />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">{liability.name}</CardTitle>
                    <CertaintyBadge certainty={liability.certainty} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span>{getCountryFlag(liability.country)} {liability.institution || liability.type}</span>
                    {liability.is_shariah_compliant && (
                      <Badge variant="outline" className="text-xs">☪️ Shariah</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-lg tabular-nums text-dusty-rose">
                    -{formatCurrency(liability.current_balance, liability.currency)}
                  </p>
                  {liability.original_amount && (
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(liability.original_amount, liability.currency)}
                    </p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Action buttons */}
            <div className="flex gap-2 justify-end border-b border-border pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(liability);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(liability);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-border pt-4">
              {liability.interest_rate && (
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{liability.interest_rate}%</p>
                </div>
              )}
              {liability.monthly_payment && (
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-medium">{formatCurrency(liability.monthly_payment, liability.currency)}</p>
                </div>
              )}
              {liability.start_date && (
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(liability.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {liability.end_date && (
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(liability.end_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            {/* Loan Schedule Section */}
            <div className="border-t border-border pt-4">
              <LoanScheduleSection
                liabilityId={liability.id}
                liabilityName={liability.name}
                currency={liability.currency}
                schedule={schedule || null}
                originalAmount={liability.original_amount || undefined}
                interestRate={liability.interest_rate || undefined}
                startDate={liability.start_date || undefined}
              />
            </div>
            
            {liability.notes && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">{liability.notes}</p>
              </div>
            )}

            {/* Documents Section */}
            <div className="border-t border-border pt-4">
              <DocumentsSection linkType="liability" linkId={liability.id} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

const LiabilitiesPage = () => {
  const { data: liabilities = [], isLoading } = useLiabilities();
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [deletingLiability, setDeletingLiability] = useState<Liability | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredLiabilities = liabilities.filter(l => {
    // Search filter
    if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !l.institution?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type filter
    if (typeFilter !== 'all' && l.type !== typeFilter) {
      return false;
    }
    // Certainty filter
    if (certaintyFilter === 'all') return true;
    const cert = l.certainty || 'certain';
    if (certaintyFilter === 'certain') return cert === 'certain';
    if (certaintyFilter === 'exclude-optional') return cert !== 'optional';
    return true;
  });
  
  return (
    <AppLayout>
      <div className="p-8 lg:p-12 max-w-5xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">Liabilities</h1>
            <p className="text-muted-foreground">
              Manage your loans, mortgages, and payment schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LoanComparisonTool />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Liability
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search liabilities..."
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LIABILITY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={certaintyFilter} onValueChange={(v) => setCertaintyFilter(v as CertaintyFilter)}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Certainty</SelectItem>
              <SelectItem value="certain">Certain Only</SelectItem>
              <SelectItem value="exclude-optional">Exclude Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Liability Breakdown Chart */}
        {liabilities.length > 0 && (
          <LiabilityBreakdownChart liabilities={liabilities} />
        )}
        
        {/* Monthly Payment Summary Widget */}
        <MonthlyPaymentSummary />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading liabilities...</p>
          </div>
        ) : filteredLiabilities.length === 0 ? (
          <div className="text-center py-16">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {liabilities.length === 0 ? 'No liabilities yet.' : 'No liabilities match your filters.'}
            </p>
            {liabilities.length === 0 && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Liability
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLiabilities.map((liability) => (
              <LiabilityCard 
                key={liability.id} 
                liability={liability}
                onEdit={setEditingLiability}
                onDelete={setDeletingLiability}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <LiabilityDialog
        open={showAddDialog || !!editingLiability}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingLiability(null);
          }
        }}
        liability={editingLiability}
      />

      {/* Delete Confirmation Dialog */}
      {deletingLiability && (
        <DeleteLiabilityDialog
          open={!!deletingLiability}
          onOpenChange={(open) => !open && setDeletingLiability(null)}
          liabilityId={deletingLiability.id}
          liabilityName={deletingLiability.name}
        />
      )}
    </AppLayout>
  );
};

export default LiabilitiesPage;
