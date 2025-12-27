import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined tag colors for consistency
export const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
  important: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' },
  archived: { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500/30' },
  personal: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  business: { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  legal: { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500/30' },
  tax: { bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500/30' },
  insurance: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500/30' },
};

// Fallback color generator for custom tags
const getTagColor = (tag: string) => {
  const normalizedTag = tag.toLowerCase();
  if (TAG_COLORS[normalizedTag]) {
    return TAG_COLORS[normalizedTag];
  }
  
  // Generate a consistent color based on the tag string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 70%, 50%, 0.2)`,
    text: `hsl(${hue}, 70%, 50%)`,
    border: `hsl(${hue}, 70%, 50%, 0.3)`,
  };
};

interface DocumentTagBadgeProps {
  tag: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const DocumentTagBadge = ({ tag, onRemove, size = 'sm' }: DocumentTagBadgeProps) => {
  const color = getTagColor(tag);
  const isPreset = TAG_COLORS[tag.toLowerCase()];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 font-normal border",
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
        isPreset ? `${color.bg} ${color.text} ${color.border}` : ''
      )}
      style={!isPreset ? {
        backgroundColor: color.bg,
        color: color.text,
        borderColor: color.border,
      } : undefined}
    >
      {tag}
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 -mr-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
};

export const SUGGESTED_TAGS = [
  'urgent',
  'important',
  'pending',
  'completed',
  'archived',
  'personal',
  'business',
  'legal',
  'tax',
  'insurance',
] as const;
