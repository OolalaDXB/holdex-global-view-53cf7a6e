import { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentTypeIcon } from './DocumentTypeIcon';

interface DocumentThumbnailProps {
  fileType: string;
  filePath?: string | null;
  signedUrl?: string | null;
  documentType: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DocumentThumbnail = ({
  fileType,
  filePath,
  signedUrl,
  documentType,
  name,
  size = 'md',
  className,
}: DocumentThumbnailProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  // Reset error state when URL changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [signedUrl]);
  
  // For images, show a thumbnail
  if (isImage && signedUrl && !imageError) {
    return (
      <div className={cn(
        'rounded-lg overflow-hidden bg-muted flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={signedUrl}
          alt={name}
          className={cn(
            'w-full h-full object-cover transition-opacity',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  
  // For PDFs with signed URL, show a styled PDF icon with preview hint
  if (isPdf && signedUrl) {
    return (
      <div className={cn(
        'rounded-lg bg-red-500/10 flex items-center justify-center relative',
        sizeClasses[size],
        className
      )}>
        <FileText size={size === 'lg' ? 24 : size === 'md' ? 20 : 16} className="text-red-500" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded text-[8px] text-white flex items-center justify-center font-bold">
          P
        </div>
      </div>
    );
  }
  
  // Default: use the document type icon
  return <DocumentTypeIcon type={documentType} size={size} className={className} />;
};
