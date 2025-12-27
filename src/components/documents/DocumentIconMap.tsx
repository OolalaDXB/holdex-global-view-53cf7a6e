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

// Map icon names to Lucide components
export const DOCUMENT_ICON_MAP: Record<string, LucideIcon> = {
  FileSignature,
  FileText,
  Receipt,
  BookUser,
  BarChart3,
  ClipboardList,
  Shield,
  Banknote,
  Award,
  File,
};

export const getDocumentIcon = (iconName: string): LucideIcon => {
  return DOCUMENT_ICON_MAP[iconName] || File;
};
