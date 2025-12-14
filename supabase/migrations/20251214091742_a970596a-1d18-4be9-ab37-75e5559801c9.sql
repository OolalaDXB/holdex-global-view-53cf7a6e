-- Add certainty breakdown columns to net_worth_history for tracking confirmed vs projected trends
ALTER TABLE public.net_worth_history 
ADD COLUMN certainty_breakdown_assets JSONB DEFAULT NULL,
ADD COLUMN certainty_breakdown_liabilities JSONB DEFAULT NULL;

COMMENT ON COLUMN public.net_worth_history.certainty_breakdown_assets IS 'Breakdown of assets by certainty level: {certain, contractual, probable, optional}';
COMMENT ON COLUMN public.net_worth_history.certainty_breakdown_liabilities IS 'Breakdown of liabilities by certainty level: {certain, contractual, probable, optional}';