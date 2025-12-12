import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

interface BlurContextType {
  isBlurred: boolean;
  toggleBlur: () => void;
  formatBlurred: (value: string | number) => string;
}

const BlurContext = createContext<BlurContextType | undefined>(undefined);

export const BlurProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [isBlurred, setIsBlurred] = useState(false);

  // Sync with profile on load
  useEffect(() => {
    if (profile?.blur_amounts !== undefined) {
      setIsBlurred(profile.blur_amounts);
    }
  }, [profile?.blur_amounts]);

  const toggleBlur = async () => {
    const newValue = !isBlurred;
    setIsBlurred(newValue);
    
    // Persist to profile if authenticated
    if (profile) {
      try {
        await updateProfile.mutateAsync({ blur_amounts: newValue });
      } catch (error) {
        // Revert on error
        setIsBlurred(!newValue);
      }
    }
  };

  const formatBlurred = (value: string | number): string => {
    if (isBlurred) {
      return '•••••';
    }
    return String(value);
  };

  return (
    <BlurContext.Provider value={{ isBlurred, toggleBlur, formatBlurred }}>
      {children}
    </BlurContext.Provider>
  );
};

export const useBlur = () => {
  const context = useContext(BlurContext);
  if (context === undefined) {
    throw new Error('useBlur must be used within a BlurProvider');
  }
  return context;
};
