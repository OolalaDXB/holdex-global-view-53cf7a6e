import { useProfile } from '@/hooks/useProfile';
import { useDemo } from '@/contexts/DemoContext';

export type ComplianceMode = 'none' | 'islamic' | 'jewish' | 'hindu' | 'all';

export const useComplianceMode = () => {
  const { data: profile } = useProfile();
  
  const mode = (profile?.compliance_mode as ComplianceMode) || 'none';
  
  return {
    mode,
    showIslamic: mode === 'islamic' || mode === 'all',
    showJewish: mode === 'jewish' || mode === 'all',
    showHindu: mode === 'hindu' || mode === 'all',
    showAnyCompliant: mode !== 'none',
  };
};

// For demo mode - always show all
export const useDemoComplianceMode = () => {
  const { profile } = useDemo();
  
  const mode = (profile?.compliance_mode as ComplianceMode) || 'all';
  
  return {
    mode,
    showIslamic: mode === 'islamic' || mode === 'all',
    showJewish: mode === 'jewish' || mode === 'all',
    showHindu: mode === 'hindu' || mode === 'all',
    showAnyCompliant: mode !== 'none',
  };
};
