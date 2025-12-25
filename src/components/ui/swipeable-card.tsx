import { ReactNode, useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableCardProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function SwipeableCard({ children, onEdit, onDelete, className }: SwipeableCardProps) {
  const isMobile = useIsMobile();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ACTION_WIDTH = 70;
  const THRESHOLD = 50;

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (!isMobile) return;
      
      // Left swipe reveals delete (right side)
      // Right swipe reveals edit (left side)
      const delta = e.deltaX;
      
      // Limit the swipe distance
      const maxSwipe = ACTION_WIDTH;
      const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, delta));
      
      setSwipeOffset(clampedDelta);
    },
    onSwipedLeft: () => {
      if (!isMobile || !onDelete) return;
      if (Math.abs(swipeOffset) > THRESHOLD) {
        setIsRevealed('left');
        setSwipeOffset(-ACTION_WIDTH);
      } else {
        resetSwipe();
      }
    },
    onSwipedRight: () => {
      if (!isMobile || !onEdit) return;
      if (Math.abs(swipeOffset) > THRESHOLD) {
        setIsRevealed('right');
        setSwipeOffset(ACTION_WIDTH);
      } else {
        resetSwipe();
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (!isRevealed) {
        // If not past threshold, snap back
        if (Math.abs(swipeOffset) < THRESHOLD) {
          resetSwipe();
        }
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsRevealed(null);
  };

  const handleEdit = () => {
    onEdit?.();
    resetSwipe();
  };

  const handleDelete = () => {
    onDelete?.();
    resetSwipe();
  };

  const handleCardClick = () => {
    if (isRevealed) {
      resetSwipe();
    }
  };

  // On desktop, just render children
  if (!isMobile || (!onEdit && !onDelete)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-lg", className)}
    >
      {/* Edit action (left side, revealed by swipe right) */}
      {onEdit && (
        <button
          onClick={handleEdit}
          className={cn(
            "absolute left-0 top-0 bottom-0 flex items-center justify-center bg-primary text-primary-foreground transition-all duration-200",
            isRevealed === 'right' ? "w-[70px]" : "w-0"
          )}
          style={{ width: swipeOffset > 0 ? Math.abs(swipeOffset) : 0 }}
        >
          <div className="flex flex-col items-center gap-1">
            <Pencil size={20} />
            <span className="text-xs font-medium">Edit</span>
          </div>
        </button>
      )}

      {/* Delete action (right side, revealed by swipe left) */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive text-destructive-foreground transition-all duration-200",
            isRevealed === 'left' ? "w-[70px]" : "w-0"
          )}
          style={{ width: swipeOffset < 0 ? Math.abs(swipeOffset) : 0 }}
        >
          <div className="flex flex-col items-center gap-1">
            <Trash2 size={20} />
            <span className="text-xs font-medium">Delete</span>
          </div>
        </button>
      )}

      {/* Main content */}
      <div
        {...handlers}
        onClick={handleCardClick}
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
