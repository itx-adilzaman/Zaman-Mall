-- ============================================================
-- Affiliate Products Table
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2) DEFAULT 0,
  image_url       TEXT NOT NULL,
  images          JSONB DEFAULT '[]',        -- extra gallery images
  affiliate_url   TEXT NOT NULL,             -- link that "Order" button opens
  brand_id        UUID REFERENCES affiliate_brands(id) ON DELETE SET NULL,
  brand_name      TEXT,                      -- denormalized for easy display
  category        TEXT DEFAULT 'General',
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY "Public can read active affiliate products"
  ON affiliate_products FOR SELECT
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage affiliate products"
  ON affiliate_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active    ON affiliate_products (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_featured  ON affiliate_products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_products_brand     ON affiliate_products (brand_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_affiliate_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliate_products_updated_at
  BEFORE UPDATE ON affiliate_products
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_products_updated_at();
