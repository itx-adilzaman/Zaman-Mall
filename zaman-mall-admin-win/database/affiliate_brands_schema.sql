-- ============================================================
-- Affiliate Brands Table
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_brands (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_urdu     TEXT,
  logo_url      TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,          -- The link that opens on "Order" button click
  description   TEXT,
  category      TEXT DEFAULT 'General', -- e.g. Shopping, Electronics, Fashion, etc.
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE affiliate_brands ENABLE ROW LEVEL SECURITY;

-- Allow public read (app users can see brands)
CREATE POLICY "Public can read active affiliate brands"
  ON affiliate_brands FOR SELECT
  USING (is_active = true);

-- Allow authenticated admins to do everything
CREATE POLICY "Admins can manage affiliate brands"
  ON affiliate_brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_affiliate_brands_active ON affiliate_brands (is_active, sort_order);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_affiliate_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliate_brands_updated_at
  BEFORE UPDATE ON affiliate_brands
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_brands_updated_at();

-- Sample data (popular affiliate brands)
INSERT INTO affiliate_brands (name, name_urdu, logo_url, affiliate_url, description, category, sort_order) VALUES
  ('Daraz',   'دراز',   'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Daraz_logo.svg/320px-Daraz_logo.svg.png',    'https://daraz.pk',    'Pakistan ka #1 online shopping platform',  'Shopping',     1),
  ('Temu',    'تیمو',   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Temu_logo.svg/320px-Temu_logo.svg.png',     'https://temu.com',    'Affordable products from around the world', 'Shopping',     2),
  ('Alibaba', 'علی بابا','https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Alibaba_Logo_(2022).svg/320px-Alibaba_Logo_(2022).svg.png', 'https://alibaba.com', 'Global wholesale marketplace',             'Wholesale',    3),
  ('AliExpress','علی ایکسپریس','https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/AliExpress_logo.svg/320px-AliExpress_logo.svg.png','https://aliexpress.com','International retail from China',          'Shopping',     4),
  ('Amazon',  'ایمازون','https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',  'https://amazon.com',  'World largest online store',                'Shopping',     5)
ON CONFLICT DO NOTHING;
