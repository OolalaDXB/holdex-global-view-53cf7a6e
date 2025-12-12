// Certainty levels for assets, liabilities, and receivables
export const CERTAINTY_LEVELS = [
  { value: 'certain', label: 'Certain', description: 'You own it, it exists, no doubt', icon: null },
  { value: 'contractual', label: 'Contractual', description: 'Legally binding but future', icon: '📄' },
  { value: 'probable', label: 'Probable', description: 'High likelihood but not guaranteed', icon: '〜' },
  { value: 'optional', label: 'Optional', description: 'Possible but uncertain', icon: '○' },
] as const;

export type CertaintyLevel = typeof CERTAINTY_LEVELS[number]['value'];

export const getCertaintyBadge = (certainty: string | null) => {
  if (!certainty || certainty === 'certain') return null;
  const level = CERTAINTY_LEVELS.find(l => l.value === certainty);
  return level ? { icon: level.icon, label: level.label } : null;
};
