import { User, UserCircle, Building2, Landmark, Shield, Users, Home, FolderClosed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityAvatarProps {
  avatarUrl?: string | null;
  entityType: string;
  entityColor?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showInitials?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-sm',
  lg: 'text-xl',
};

const getDefaultIcon = (entityType: string) => {
  switch (entityType) {
    case 'personal':
      return User;
    case 'partner':
    case 'spouse':
      return UserCircle;
    case 'couple':
    case 'family':
      return Users;
    case 'company':
      return Building2;
    case 'holding':
      return Landmark;
    case 'spv':
      return FolderClosed;
    case 'trust':
      return Shield;
    case 'huf':
      return Home;
    default:
      return Building2;
  }
};

const getInitials = (name: string): string => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Entity types that should show initials when no photo
const initialsEntityTypes = ['personal', 'partner', 'spouse'];

export const EntityAvatar = ({
  avatarUrl,
  entityType,
  entityColor,
  name,
  size = 'md',
  className,
  showInitials = true,
}: EntityAvatarProps) => {
  const Icon = getDefaultIcon(entityType);
  const bgColor = entityColor || '#C4785A';
  const shouldShowInitials = showInitials && initialsEntityTypes.includes(entityType) && name;

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border/50',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={avatarUrl}
          alt={name || 'Entity avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Show initials for personal/partner entities
  if (shouldShowInitials) {
    const initials = getInitials(name);
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0 font-medium',
          sizeClasses[size],
          textSizeClasses[size],
          className
        )}
        style={{ 
          backgroundColor: bgColor,
          color: '#F5F5F0'
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${bgColor}20` }}
    >
      <Icon 
        className={iconSizeClasses[size]} 
        style={{ color: bgColor }}
      />
    </div>
  );
};