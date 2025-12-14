import { useState } from 'react';
import { Home, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { LoanScheduleSection } from '@/components/liabilities/LoanScheduleSection';
import { useLoanSchedule } from '@/hooks/useLoanSchedules';

interface PropertyEquity {
  assetId: string;
  assetName: string;
  assetValue: number;
  liabilityId: string;
  liabilityName: string;
  liabilityBalance: number;
  equity: number;
  equityPercentage: number;
  currency: string;
  originalAmount?: number;
  interestRate?: number;
  startDate?: string;
}

interface PropertyEquityWidgetProps {
  properties: PropertyEquity[];
  displayCurrency: string;
  isBlurred?: boolean;
}

function PropertyDetailSheet({ 
  property, 
  open, 
  onOpenChange,
  displayCurrency,
  isBlurred
}: { 
  property: PropertyEquity; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  displayCurrency: string;
  isBlurred: boolean;
}) {
  const { data: schedule } = useLoanSchedule(property.liabilityId);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Home size={18} />
            {property.assetName}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Equity Summary */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Equity Summary</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Property Value</p>
                <p className="font-semibold tabular-nums">
                  {isBlurred ? '•••••' : formatCurrency(property.assetValue, displayCurrency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Loan</p>
                <p className="font-semibold tabular-nums text-negative">
                  {isBlurred ? '•••••' : `-${formatCurrency(property.liabilityBalance, displayCurrency)}`}
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Your Equity</p>
                  <p className={cn(
                    "text-xl font-bold tabular-nums",
                    property.equity >= 0 ? "text-positive" : "text-negative"
                  )}>
                    {isBlurred ? '•••••' : formatCurrency(property.equity, displayCurrency)}
                  </p>
                </div>
                <div className={cn(
                  "text-right px-3 py-1.5 rounded-full",
                  property.equityPercentage >= 50 ? "bg-positive/10 text-positive" :
                  property.equityPercentage >= 20 ? "bg-primary/10 text-primary" : 
                  "bg-warning/10 text-warning"
                )}>
                  <span className="text-lg font-bold tabular-nums">
                    {isBlurred ? '••' : `${property.equityPercentage.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Equity bar */}
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                  property.equityPercentage >= 50 ? "bg-positive" : 
                  property.equityPercentage >= 20 ? "bg-primary" : "bg-warning"
                )}
                style={{ width: `${Math.min(property.equityPercentage, 100)}%` }}
              />
            </div>
            
            {property.equityPercentage < 20 && (
              <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-md">
                <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">
                  Equity below 20%. Consider accelerating payments to build equity faster.
                </p>
              </div>
            )}
          </div>
          
          {/* Loan Schedule */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Payment Schedule
            </h4>
            <LoanScheduleSection
              liabilityId={property.liabilityId}
              liabilityName={property.liabilityName}
              currency={property.currency}
              schedule={schedule || null}
              originalAmount={property.originalAmount}
              interestRate={property.interestRate}
              startDate={property.startDate}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PropertyEquityWidget({ 
  properties, 
  displayCurrency,
  isBlurred = false 
}: PropertyEquityWidgetProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyEquity | null>(null);
  
  if (properties.length === 0) return null;

  const totalAssetValue = properties.reduce((sum, p) => sum + p.assetValue, 0);
  const totalEquity = properties.reduce((sum, p) => sum + p.equity, 0);
  const overallEquityPercentage = totalAssetValue > 0 ? (totalEquity / totalAssetValue) * 100 : 0;
  const lowEquityCount = properties.filter(p => p.equityPercentage < 20).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg font-medium text-foreground">Property Equity</h3>
          {lowEquityCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                  <AlertTriangle size={12} className="mr-1" />
                  {lowEquityCount} low
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lowEquityCount} {lowEquityCount === 1 ? 'property has' : 'properties have'} equity below 20%</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm text-muted-foreground tabular-nums">
              {isBlurred ? '••%' : `${overallEquityPercentage.toFixed(0)}% equity`}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total equity across all mortgaged properties</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-3">
        {properties.map((property) => (
          <button
            key={property.assetId}
            onClick={() => setSelectedProperty(property)}
            className="w-full text-left space-y-1.5 p-2 -m-2 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Home size={14} className="text-muted-foreground" />
                <span className="text-foreground truncate max-w-[160px]">{property.assetName}</span>
                {property.equityPercentage < 20 && (
                  <AlertTriangle size={14} className="text-warning shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "tabular-nums font-medium",
                  property.equity >= 0 ? "text-positive" : "text-negative"
                )}>
                  {isBlurred ? '•••' : formatCurrency(property.equity, displayCurrency)}
                </span>
                <span className={cn(
                  "text-xs tabular-nums",
                  property.equityPercentage < 20 ? "text-warning" : "text-muted-foreground"
                )}>
                  {isBlurred ? '••%' : `${property.equityPercentage.toFixed(0)}%`}
                </span>
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Equity bar */}
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                  property.equityPercentage >= 50 ? "bg-positive" : 
                  property.equityPercentage >= 20 ? "bg-primary" : "bg-warning"
                )}
                style={{ width: `${Math.min(property.equityPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Value: {isBlurred ? '•••' : formatCurrency(property.assetValue, displayCurrency)}</span>
              <span>Loan: {isBlurred ? '•••' : formatCurrency(property.liabilityBalance, displayCurrency)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total equity</span>
          <span className={cn(
            "font-semibold tabular-nums",
            totalEquity >= 0 ? "text-positive" : "text-negative"
          )}>
            {isBlurred ? '•••••' : formatCurrency(totalEquity, displayCurrency)}
          </span>
        </div>
      </div>
      
      {/* Detail Sheet */}
      {selectedProperty && (
        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedProperty}
          onOpenChange={(open) => !open && setSelectedProperty(null)}
          displayCurrency={displayCurrency}
          isBlurred={isBlurred}
        />
      )}
    </div>
  );
}
