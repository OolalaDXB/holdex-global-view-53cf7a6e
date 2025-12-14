import { z } from 'zod';

// Ownership allocation schema and type
export const OwnershipAllocationSchema = z.object({
  entity_id: z.string(),
  percentage: z.number(),
});

export type OwnershipAllocation = z.infer<typeof OwnershipAllocationSchema>;

// Safe parse helper for ownership allocation
export const parseOwnershipAllocation = (
  data: unknown
): OwnershipAllocation[] | null => {
  if (!Array.isArray(data)) return null;
  
  const result = z.array(OwnershipAllocationSchema).safeParse(data);
  return result.success ? result.data : null;
};

// Beneficiary schema and type (for trusts)
export const BeneficiarySchema = z.object({
  name: z.string(),
  percentage: z.number().optional(),
  relationship: z.string().optional(),
});

export type Beneficiary = z.infer<typeof BeneficiarySchema>;

export const parseBeneficiaries = (data: unknown): Beneficiary[] | null => {
  if (!Array.isArray(data)) return null;
  const result = z.array(BeneficiarySchema).safeParse(data);
  return result.success ? result.data : null;
};

// Coparcener schema and type (for HUF)
export const CoparcenerSchema = z.object({
  name: z.string(),
  relationship: z.string().optional(),
  share: z.number().optional(),
});

export type Coparcener = z.infer<typeof CoparcenerSchema>;

export const parseCoparceners = (data: unknown): Coparcener[] | null => {
  if (!Array.isArray(data)) return null;
  const result = z.array(CoparcenerSchema).safeParse(data);
  return result.success ? result.data : null;
};

// Helper to get user's ownership share from parsed allocation
export const getUserOwnershipShare = (
  allocation: OwnershipAllocation[] | null | undefined,
  entityId: string | null
): number => {
  if (!allocation || allocation.length === 0) return 1;
  if (!entityId) return 1;
  const entry = allocation.find(a => a.entity_id === entityId);
  return entry ? entry.percentage / 100 : 1;
};

// Recharts tooltip props type
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: Record<string, unknown>;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

// Recharts legend props type
export interface RechartsLegendProps {
  payload?: Array<{
    value: string;
    type?: string;
    id?: string;
    color?: string;
  }>;
}
