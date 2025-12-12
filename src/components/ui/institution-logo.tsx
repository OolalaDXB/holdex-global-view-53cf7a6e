import { useState } from 'react';
import { getInstitutionLogo, getLogoFallback } from '@/lib/logos';
import { cn } from '@/lib/utils';

interface InstitutionLogoProps {
  institution: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstitutionLogo({ institution, size = 'md', className }: InstitutionLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getInstitutionLogo(institution);
  const fallback = getLogoFallback(institution);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  if (hasError || !logoUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-md bg-secondary text-secondary-foreground font-medium",
        sizeClasses[size],
        className
      )}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${institution} logo`}
      className={cn("rounded-md object-contain bg-white", sizeClasses[size], className)}
      onError={() => setHasError(true)}
    />
  );
}
