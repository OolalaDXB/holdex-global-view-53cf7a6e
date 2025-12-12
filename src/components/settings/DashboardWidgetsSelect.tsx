import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Widget {
  id: string;
  label: string;
  description: string;
}

// Always visible - cannot be hidden
const CORE_WIDGETS: Widget[] = [
  { id: 'net_worth', label: 'Net Worth Card', description: 'Always visible' },
  { id: 'chart', label: 'Historical Chart', description: 'Always visible' },
];

// Collapsible breakdowns - always shown but collapsed by default
const BREAKDOWN_WIDGETS: Widget[] = [
  { id: 'breakdown_type', label: 'Breakdown by Type', description: 'Collapsible' },
  { id: 'breakdown_country', label: 'Breakdown by Country', description: 'Collapsible' },
  { id: 'breakdown_currency', label: 'Breakdown by Currency', description: 'Collapsible' },
  { id: 'breakdown_entity', label: 'Breakdown by Entity', description: 'Collapsible' },
];

// Optional widgets - hidden by default
const OPTIONAL_WIDGETS: Widget[] = [
  { id: 'certainty_breakdown', label: 'Certainty Breakdown', description: 'Confirmed vs projected' },
  { id: 'debt_to_income', label: 'Debt-to-Income Ratio', description: 'DTI health indicator' },
  { id: 'net_worth_projection', label: 'Net Worth Projection', description: 'Future wealth forecast' },
  { id: 'leasehold_reminders', label: 'Leasehold Reminders', description: 'Expiring leases' },
  { id: 'expiring_documents', label: 'Expiring Documents', description: 'Documents due soon' },
  { id: 'pending_receivables', label: 'Pending Receivables', description: 'Money owed to you' },
  { id: 'upcoming_loan_payments', label: 'Upcoming Loan Payments', description: 'Loan payment due dates' },
  { id: 'world_clocks', label: 'World Clocks', description: 'Time in favorite cities' },
  { id: 'weather_with_clocks', label: 'Weather with Clocks', description: 'Show weather icons' },
  { id: 'news_ticker', label: 'News Ticker', description: 'Financial headlines bar' },
];

interface DashboardWidgetsSelectProps {
  value: string[];
  onChange: (widgets: string[]) => void;
}

export const DashboardWidgetsSelect: React.FC<DashboardWidgetsSelectProps> = ({
  value,
  onChange,
}) => {
  const toggleWidget = (widgetId: string) => {
    if (value.includes(widgetId)) {
      onChange(value.filter(id => id !== widgetId));
    } else {
      onChange([...value, widgetId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Core widgets - always visible */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Always Visible</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CORE_WIDGETS.map(widget => (
            <div key={widget.id} className="flex items-start gap-3 opacity-60">
              <Checkbox
                id={`widget-${widget.id}`}
                checked={true}
                disabled
              />
              <div className="flex flex-col">
                <Label htmlFor={`widget-${widget.id}`} className="cursor-not-allowed">
                  {widget.label}
                </Label>
                <span className="text-xs text-muted-foreground">{widget.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown sections - always shown, collapsible */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Breakdown Sections</h4>
        <p className="text-xs text-muted-foreground mb-3">These are always visible but collapsed by default. Click to expand on dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BREAKDOWN_WIDGETS.map(widget => (
            <div key={widget.id} className="flex items-start gap-3 opacity-60">
              <Checkbox
                id={`widget-${widget.id}`}
                checked={true}
                disabled
              />
              <div className="flex flex-col">
                <Label htmlFor={`widget-${widget.id}`} className="cursor-not-allowed">
                  {widget.label}
                </Label>
                <span className="text-xs text-muted-foreground">{widget.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional widgets */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Optional Widgets</h4>
        <p className="text-xs text-muted-foreground mb-3">Enable these to show additional insights on your dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OPTIONAL_WIDGETS.map(widget => (
            <div key={widget.id} className="flex items-start gap-3">
              <Checkbox
                id={`widget-${widget.id}`}
                checked={value.includes(widget.id)}
                onCheckedChange={() => toggleWidget(widget.id)}
              />
              <div className="flex flex-col">
                <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer">
                  {widget.label}
                </Label>
                <span className="text-xs text-muted-foreground">{widget.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
