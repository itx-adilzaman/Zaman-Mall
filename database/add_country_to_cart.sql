-- Add country column to cart table
-- This migration adds a country field to track product origin in the cart

ALTER TABLE cart 
ADD COLUMN IF NOT EXISTS country VARCHAR(20) DEFAULT 'pakistan';

-- Add a check constraint to ensure only valid country values are used
-- Note: This might fail if the table already has a constraint with this name, 
-- but using a unique name for cart table.
ALTER TABLE cart 
ADD CONSTRAINT check_cart_country_valid 
CHECK (country IN ('pakistan', 'china'));

-- Create an index on the country column for faster filtering
CREATE INDEX IF NOT EXISTS idx_cart_country ON cart(country);

-- Update existing cart items to have 'pakistan' as default country if they are missing it
UPDATE cart 
SET country = 'pakistan' 
WHERE country IS NULL OR country = '';
