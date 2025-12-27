import { 
  FileText, 
  FileSignature, 
  Receipt, 
  BookUser, 
  BarChart3, 
  ClipboardList, 
  Shield, 
  Banknote, 
  Award, 
  File,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map document types to Lucide icons with colors
export const DOCUMENT_TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  title_deed: { icon: FileSignature, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  contract: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  invoice: { icon: Receipt, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  passport: { icon: BookUser, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  tax_return: { icon: BarChart3, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  statement: { icon: ClipboardList, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  insurance: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  valuation: { icon: Banknote, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  certificate: { icon: Award, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  other: { icon: File, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

interface DocumentTypeIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DocumentTypeIcon = ({ type, size = 'md', className }: DocumentTypeIconProps) => {
  const iconConfig = DOCUMENT_TYPE_ICONS[type] || DOCUMENT_TYPE_ICONS.other;
  const Icon = iconConfig.icon;
  
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
    <div className={cn(
      'rounded-lg flex items-center justify-center',
      iconConfig.bgColor,
      sizeClasses[size],
      className
    )}>
      <Icon size={iconSizes[size]} className={iconConfig.color} />
    </div>
  );
};

// Updated document types with Lucide icon names for selects
export const DOCUMENT_TYPES_WITH_ICONS = [
  { value: 'title_deed', label: 'Title Deed', iconName: 'FileSignature' },
  { value: 'contract', label: 'Contract', iconName: 'FileText' },
  { value: 'invoice', label: 'Invoice', iconName: 'Receipt' },
  { value: 'passport', label: 'Passport', iconName: 'BookUser' },
  { value: 'tax_return', label: 'Tax Return', iconName: 'BarChart3' },
  { value: 'statement', label: 'Statement', iconName: 'ClipboardList' },
  { value: 'insurance', label: 'Insurance', iconName: 'Shield' },
  { value: 'valuation', label: 'Valuation', iconName: 'Banknote' },
  { value: 'certificate', label: 'Certificate', iconName: 'Award' },
  { value: 'other', label: 'Other', iconName: 'File' },
] as const;
