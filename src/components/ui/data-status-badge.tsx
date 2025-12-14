import { RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DataStatus = 'live' | 'stale' | 'unavailable';

interface DataStatusBadgeProps {
  label: string;
  status: DataStatus;
  lastUpdated?: string | number | null;
  cacheTimestamp?: number | null;
  isFetching?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function DataStatusBadge({
  label,
  status,
  lastUpdated,
  cacheTimestamp,
  isFetching = false,
  onRefresh,
  className,
}: DataStatusBadgeProps) {
  const formatTime = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (status === 'unavailable') {
    return (
      <div className={cn("flex items-center gap-1 text-destructive text-xs", className)}>
        <AlertTriangle size={12} />
        <span>{label} unavailable</span>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={isFetching}
            className="ml-1 hover:text-foreground transition-colors"
            title={`Retry fetching ${label.toLowerCase()}`}
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    );
  }

  if (status === 'stale') {
    const cachedTime = cacheTimestamp 
      ? formatTime(cacheTimestamp) 
      : 'earlier';
    
    return (
      <div className={cn("flex items-center gap-1 text-yellow-600 text-xs", className)}>
        <AlertTriangle size={12} />
        <span>Cached {label.toLowerCase()} from {cachedTime}</span>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={isFetching}
            className="ml-1 hover:text-foreground transition-colors"
            title={`Retry fetching live ${label.toLowerCase()}`}
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    );
  }

  // Live status
  if (!lastUpdated) return null;

  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground text-xs", className)}>
      <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
      <span>
        {label}: {typeof lastUpdated === 'string' && lastUpdated.includes('T') 
          ? formatDate(lastUpdated) 
          : formatTime(lastUpdated)}
      </span>
    </div>
  );
}
