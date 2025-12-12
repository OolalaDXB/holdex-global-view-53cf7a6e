-- Add property details fields for real estate assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS rooms INTEGER,
ADD COLUMN IF NOT EXISTS size_sqm NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN public.assets.property_type IS 'Type of property: apartment, villa, studio, office, warehouse, land, townhouse, penthouse';
COMMENT ON COLUMN public.assets.rooms IS 'Number of rooms/bedrooms';
COMMENT ON COLUMN public.assets.size_sqm IS 'Size in square meters';