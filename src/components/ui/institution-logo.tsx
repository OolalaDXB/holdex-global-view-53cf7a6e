import { useState, useEffect } from 'react';
import { getInstitutionLogo, getLogoFallback } from '@/lib/logos';
import { cn } from '@/lib/utils';

interface InstitutionLogoProps {
  institution: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstitutionLogo({ institution, size = 'md', className }: InstitutionLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const logoUrl = getInstitutionLogo(institution);
  const fallback = getLogoFallback(institution);
  
  // Reset error state when institution changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [institution]);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-xs',
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
    <div className={cn("relative", sizeClasses[size], className)}>
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-md bg-secondary text-secondary-foreground font-medium",
          sizeClasses[size]
        )}>
          {fallback}
        </div>
      )}
      <img
        src={logoUrl}
        alt={`${institution} logo`}
        className={cn(
          "rounded-md object-contain bg-white w-full h-full",
          isLoading && "opacity-0"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
