// Certainty levels for assets, liabilities, and receivables
export const CERTAINTY_LEVELS = [
  { value: 'certain', label: 'Verified', icon: '✓', description: 'Confirmed value with documentation' },
  { value: 'contractual', label: 'Committed', icon: '📄', description: 'Legally binding but future' },
  { value: 'probable', label: 'Estimated', icon: '~', description: 'High likelihood but not guaranteed' },
  { value: 'optional', label: 'Speculative', icon: '?', description: 'Possible but uncertain' },
] as const;

export type CertaintyLevel = typeof CERTAINTY_LEVELS[number]['value'];

export const getCertaintyBadge = (certainty: string | null) => {
  if (!certainty || certainty === 'certain') return null;
  const level = CERTAINTY_LEVELS.find(l => l.value === certainty);
  return level ? { icon: level.icon, label: level.label } : null;
};

// Get default certainty based on asset type and optional property status
export const getDefaultCertainty = (
  type: string,
  options?: {
    propertyStatus?: string;
    recoveryProbability?: string;
  }
): CertaintyLevel => {
  // Assets
  if (type === 'real-estate') {
    if (options?.propertyStatus === 'off_plan' || options?.propertyStatus === 'under_construction') {
      return 'contractual';
    }
    return 'certain';
  }
  if (type === 'bank') return 'certain';
  if (type === 'investment') return 'probable';
  if (type === 'crypto') return 'probable';
  if (type === 'business') return 'probable';
  
  // Collections
  if (type === 'watch' || type === 'vehicle' || type === 'art' || type === 'jewelry' || type === 'wine') {
    return 'probable';
  }
  if (type === 'lp-position') return 'contractual';
  
  // Liabilities (all types)
  if (type === 'liability' || type === 'mortgage' || type === 'personal_loan' || type === 'vehicle_loan' ||
      type === 'student_loan' || type === 'business_loan' || type === 'credit_card' || type === 'line_of_credit' ||
      type === 'margin_loan' || type === 'tax_debt' || type === 'family_loan' || type === 'loan' || type === 'other') {
    return 'certain';
  }
  
  // Receivables
  if (type === 'deposit') return 'certain';
  if (type === 'expense_reimbursement') return 'probable';
  if (type === 'personal_loan' || type === 'business_loan') {
    // Map recovery probability to certainty
    const prob = options?.recoveryProbability;
    if (prob === 'certain') return 'certain';
    if (prob === 'likely') return 'contractual';
    if (prob === 'uncertain') return 'probable';
    if (prob === 'doubtful') return 'optional';
    return 'contractual'; // default for loans
  }
  
  return 'certain'; // default fallback
};
