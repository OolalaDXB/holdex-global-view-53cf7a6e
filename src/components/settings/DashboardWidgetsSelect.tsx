import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Widget {
  id: string;
  label: string;
  description: string;
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'net_worth', label: 'Net Worth Card', description: 'Total net worth display' },
  { id: 'chart', label: 'Historical Chart', description: 'Net worth over time' },
  { id: 'breakdown_type', label: 'Breakdown by Type', description: 'Assets by category' },
  { id: 'breakdown_country', label: 'Breakdown by Country', description: 'Assets by location' },
  { id: 'breakdown_currency', label: 'Breakdown by Currency', description: 'Currency exposure' },
  { id: 'breakdown_entity', label: 'Breakdown by Entity', description: 'Assets by ownership' },
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {AVAILABLE_WIDGETS.map(widget => (
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
  );
};
