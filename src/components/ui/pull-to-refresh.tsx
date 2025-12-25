import { ReactNode, useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isRefreshing) return;
    
    // Only enable pull-to-refresh when at the top of the page
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isMobile, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    // Only pull down, not up
    if (distance > 0) {
      // Apply resistance for a natural feel
      const resistedDistance = Math.min(MAX_PULL, distance * 0.5);
      setPullDistance(resistedDistance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep a small distance while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  // On desktop, just render children
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const isReady = pullDistance >= THRESHOLD;

  return (
    <div 
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-all duration-200 overflow-hidden",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: isRefreshing ? 60 : pullDistance,
          top: 0,
        }}
      >
        <div 
          className={cn(
            "flex flex-col items-center gap-1 text-muted-foreground transition-all",
            isReady && !isRefreshing && "text-primary"
          )}
        >
          <RefreshCw 
            size={24} 
            className={cn(
              "transition-transform duration-200",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing ? 'rotate(0deg)' : `rotate(${progress * 180}deg)`,
            }}
          />
          <span className="text-xs font-medium">
            {isRefreshing 
              ? "Refreshing..." 
              : isReady 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
