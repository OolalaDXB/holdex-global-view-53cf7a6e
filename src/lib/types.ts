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
