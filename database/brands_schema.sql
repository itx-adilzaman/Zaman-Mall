-- ============================================================
-- BRANDS TABLE - Zaman Sons Super Mall
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL,
  name_urdu   TEXT,
  logo_url    TEXT    NOT NULL,
  website_url TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (everyone can see brands)
CREATE POLICY "Brands are viewable by everyone"
  ON brands FOR SELECT
  USING (true);

-- Policy: Only authenticated admins can insert
CREATE POLICY "Admins can insert brands"
  ON brands FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated admins can update
CREATE POLICY "Admins can update brands"
  ON brands FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Only authenticated admins can delete
CREATE POLICY "Admins can delete brands"
  ON brands FOR DELETE
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at_trigger
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_brands_updated_at();

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_brands_active    ON brands(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_brands_sort      ON brands(sort_order);

-- ============================================================
-- SAMPLE DATA (optional - delete if not needed)
-- ============================================================
-- INSERT INTO brands (name, name_urdu, logo_url, website_url, is_active, sort_order) VALUES
--   ('Samsung',  'سام سنگ',   'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',  'https://samsung.com',  true, 1),
--   ('Apple',    'ایپل',      'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', 'https://apple.com',   true, 2),
--   ('Nike',     'نائیک',     'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',        'https://nike.com',    true, 3),
--   ('Adidas',   'ایڈیڈاس',   'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',     'https://adidas.com',  true, 4),
--   ('Sony',     'سونی',      'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',       'https://sony.com',    true, 5),
--   ('LG',       'ایل جی',    'https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg', 'https://lg.com',   true, 6);
