import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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
  { id: 'certainty_trend', label: 'Certainty Trend', description: 'Historical certainty chart' },
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

interface SortableWidgetItemProps {
  widget: Widget;
  isEnabled: boolean;
  onToggle: () => void;
}

function SortableWidgetItem({ widget, isEnabled, onToggle }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-md border border-border bg-card',
        isDragging && 'opacity-50 shadow-lg',
        !isEnabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Checkbox
        id={`widget-${widget.id}`}
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer truncate">
          {widget.label}
        </Label>
        <span className="text-xs text-muted-foreground truncate">{widget.description}</span>
      </div>
    </div>
  );
}

interface DashboardWidgetsSelectProps {
  value: string[];
  onChange: (widgets: string[]) => void;
}

export const DashboardWidgetsSelect: React.FC<DashboardWidgetsSelectProps> = ({
  value,
  onChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort optional widgets based on their order in value array
  const sortedOptionalWidgets = useMemo(() => {
    const enabledWidgets = OPTIONAL_WIDGETS.filter(w => value.includes(w.id));
    const disabledWidgets = OPTIONAL_WIDGETS.filter(w => !value.includes(w.id));
    
    // Sort enabled widgets by their position in value array
    enabledWidgets.sort((a, b) => value.indexOf(a.id) - value.indexOf(b.id));
    
    return [...enabledWidgets, ...disabledWidgets];
  }, [value]);

  const toggleWidget = (widgetId: string) => {
    if (value.includes(widgetId)) {
      onChange(value.filter(id => id !== widgetId));
    } else {
      onChange([...value, widgetId]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id as string);
      const newIndex = value.indexOf(over.id as string);
      
      // Only reorder if both items are in the enabled list
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(value, oldIndex, newIndex));
      } else if (oldIndex === -1 && newIndex !== -1) {
        // Dragging a disabled item to an enabled position - enable it
        const newValue = [...value];
        newValue.splice(newIndex, 0, active.id as string);
        onChange(newValue);
      }
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

      {/* Optional widgets with drag-to-reorder */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Optional Widgets</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Enable widgets and drag to reorder. Enabled widgets appear on your dashboard in this order.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedOptionalWidgets.map(w => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedOptionalWidgets.map(widget => (
                <SortableWidgetItem
                  key={widget.id}
                  widget={widget}
                  isEnabled={value.includes(widget.id)}
                  onToggle={() => toggleWidget(widget.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
