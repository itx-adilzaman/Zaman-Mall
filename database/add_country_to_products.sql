-- Add country column to products table
-- This migration adds a country field to track whether a product is from Pakistan or China

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS country VARCHAR(20) DEFAULT 'pakistan';

-- Add a check constraint to ensure only valid country values are used
ALTER TABLE products 
ADD CONSTRAINT check_country_valid 
CHECK (country IN ('pakistan', 'china'));

-- Create an index on the country column for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country);

-- Update existing products to have 'pakistan' as default country
UPDATE products 
SET country = 'pakistan' 
WHERE country IS NULL OR country = '';
