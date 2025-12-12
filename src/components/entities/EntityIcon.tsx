import { 
  User, 
  UserCircle, 
  Users, 
  Building2, 
  Landmark, 
  FolderClosed, 
  Shield, 
  Home,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  User,
  UserCircle,
  Users,
  Building2,
  Landmark,
  FolderClosed,
  Shield,
  Home,
};

// Color classes for each entity type (partner replaces spouse)
const colorMap: Record<string, string> = {
  personal: 'text-slate-500',
  partner: 'text-rose-500',
  spouse: 'text-rose-500', // backward compatibility
  couple: 'text-violet-500',
  company: 'text-zinc-500',
  holding: 'text-amber-500',
  spv: 'text-orange-500',
  trust: 'text-emerald-500',
  family: 'text-teal-500',
  huf: 'text-amber-600',
};

const bgColorMap: Record<string, string> = {
  personal: 'bg-slate-500/10',
  partner: 'bg-rose-500/10',
  spouse: 'bg-rose-500/10', // backward compatibility
  couple: 'bg-violet-500/10',
  company: 'bg-zinc-500/10',
  holding: 'bg-amber-500/10',
  spv: 'bg-orange-500/10',
  trust: 'bg-emerald-500/10',
  family: 'bg-teal-500/10',
  huf: 'bg-amber-600/10',
};

interface EntityIconProps {
  iconName: string;
  entityType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EntityIcon = ({ iconName, entityType, size = 'md', className }: EntityIconProps) => {
  const Icon = iconMap[iconName] || User;
  const colorClass = colorMap[entityType] || 'text-muted-foreground';
  const bgClass = bgColorMap[entityType] || 'bg-muted';
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const iconSizes = {
    sm: 14,
    md: 20,
    lg: 24,
  };

  return (
    <div className={cn(
      'rounded-lg flex items-center justify-center',
      sizeClasses[size],
      bgClass,
      className
    )}>
      <Icon size={iconSizes[size]} className={colorClass} />
    </div>
  );
};

export const getEntityIconName = (type: string): string => {
  const typeToIcon: Record<string, string> = {
    personal: 'User',
    partner: 'UserCircle',
    spouse: 'UserCircle', // backward compatibility
    couple: 'Users',
    company: 'Building2',
    holding: 'Landmark',
    spv: 'FolderClosed',
    trust: 'Shield',
    family: 'Users',
    huf: 'Home',
  };
  return typeToIcon[type] || 'User';
};