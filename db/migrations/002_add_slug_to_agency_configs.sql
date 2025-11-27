-- Add slug column to agency_configs table

ALTER TABLE agency_configs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS agency_configs_slug_idx ON agency_configs(slug);

-- Generate slugs for existing records (if any)
-- This uses a simple approach: lowercase name with hyphens and append a random string
UPDATE agency_configs
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE agency_configs ALTER COLUMN slug SET NOT NULL;
