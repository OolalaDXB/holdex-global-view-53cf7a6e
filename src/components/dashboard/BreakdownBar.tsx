import { cn } from '@/lib/utils';

interface BreakdownItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface BreakdownBarProps {
  title: string;
  items: BreakdownItem[];
  delay?: number;
  isBlurred?: boolean;
}

const defaultColors = [
  'bg-primary',
  'bg-sage',
  'bg-muted-foreground',
  'bg-dusty-rose',
  'bg-warm-gray',
];

export function BreakdownBar({ title, items, delay = 0, isBlurred = false }: BreakdownBarProps) {
  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="font-serif text-lg font-medium text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground">{item.label}</span>
              <span className="text-muted-foreground tabular-nums">{isBlurred ? '•••' : `${item.percentage.toFixed(0)}%`}</span>
            </div>
            <div className="stat-bar">
              <div 
                className={cn("stat-bar-fill", item.color || defaultColors[index % defaultColors.length])}
                style={{ 
                  width: `${item.percentage}%`,
                  transitionDelay: `${delay + (index * 100)}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
