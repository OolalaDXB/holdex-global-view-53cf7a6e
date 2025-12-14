import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Plus, Pencil, Trash2, Download, FileDown, RefreshCw } from 'lucide-react';
import { useAuditEvents, AUDIT_ACTIONS, ENTITY_TYPE_LABELS } from '@/hooks/useAuditEvents';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const ACTION_ICONS: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  download: Download,
  export_pdf: FileDown,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-500',
  update: 'text-blue-500',
  delete: 'text-red-500',
  download: 'text-purple-500',
  export_pdf: 'text-orange-500',
};

export const AuditLogViewer = () => {
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: events = [], isLoading, refetch } = useAuditEvents({
    actionFilter,
    startDate,
    endDate,
    limit: 100,
  });

  const clearFilters = () => {
    setActionFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || FileText;
    return <Icon className={cn("h-4 w-4", ACTION_COLORS[action] || "text-muted-foreground")} />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[140px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {startDate ? format(startDate, 'MMM d') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[140px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {endDate ? format(endDate, 'MMM d') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(actionFilter !== 'all' || startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={() => refetch()} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Event List */}
      <ScrollArea className="h-[400px] rounded-md border border-border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading audit log...
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No audit events found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActionIcon(event.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-foreground">
                        {ENTITY_TYPE_LABELS[event.entity_type] || event.entity_type}
                      </span>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {event.metadata.name && `"${event.metadata.name}"`}
                        {event.metadata.shared_with_email && `to ${event.metadata.shared_with_email}`}
                        {event.metadata.status && `status: ${event.metadata.status}`}
                        {event.metadata.asOfDate && `as of ${event.metadata.asOfDate}`}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.created_at), 'MMM d, HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Showing up to 100 most recent events. Audit logs are stored permanently.
      </p>
    </div>
  );
};
