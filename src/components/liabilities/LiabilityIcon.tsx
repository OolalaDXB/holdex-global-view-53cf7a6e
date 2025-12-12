import {
  Home,
  Car,
  Wallet,
  GraduationCap,
  Briefcase,
  CreditCard,
  ArrowLeftRight,
  LineChart,
  Receipt,
  Heart,
  CircleDashed,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Car,
  Wallet,
  GraduationCap,
  Briefcase,
  CreditCard,
  ArrowLeftRight,
  LineChart,
  Receipt,
  Heart,
  CircleDashed,
};

const liabilityTypeIcons: Record<string, string> = {
  mortgage: 'Home',
  car_loan: 'Car',
  personal_loan: 'Wallet',
  student_loan: 'GraduationCap',
  business_loan: 'Briefcase',
  credit_card: 'CreditCard',
  line_of_credit: 'ArrowLeftRight',
  margin_loan: 'LineChart',
  tax_debt: 'Receipt',
  family_loan: 'Heart',
  other: 'CircleDashed',
};

interface LiabilityIconProps {
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LiabilityIcon = ({ type, className, size = 'md' }: LiabilityIconProps) => {
  const iconName = liabilityTypeIcons[type] || 'CircleDashed';
  const Icon = iconMap[iconName] || CircleDashed;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center bg-secondary/50',
        sizeClasses[size],
        className
      )}
    >
      <Icon
        size={iconSizes[size]}
        strokeWidth={1.5}
        className="text-muted-foreground"
      />
    </div>
  );
};

// Get icon component directly for use in other contexts
export const getLiabilityIcon = (type: string): LucideIcon => {
  const iconName = liabilityTypeIcons[type] || 'CircleDashed';
  return iconMap[iconName] || CircleDashed;
};
