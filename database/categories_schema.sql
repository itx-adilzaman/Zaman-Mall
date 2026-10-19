-- Categories table for mobile app
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_urdu TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (public)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Policy: Allow insert for authenticated users (admin)
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow update for authenticated users (admin)
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Allow delete for authenticated users (admin)
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
