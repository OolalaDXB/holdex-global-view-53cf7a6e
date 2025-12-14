-- Update collections type constraint to include 'vinyl' instead of 'lp-position'
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_type_check;
ALTER TABLE collections ADD CONSTRAINT collections_type_check 
  CHECK (type IN ('watch', 'vehicle', 'art', 'jewelry', 'wine', 'vinyl', 'lp-position', 'other'));

-- Migrate existing lp-position to vinyl (optional - only if any exist)
UPDATE collections SET type = 'vinyl' WHERE type = 'lp-position';