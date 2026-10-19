-- Supabase SQL Schema for App Versions Table
-- This table manages version control for Zaman Mall mobile app

-- Create app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_code TEXT NOT NULL UNIQUE, -- e.g., "1.1.0"
  download_url TEXT NOT NULL, -- Direct APK link
  is_critical BOOLEAN DEFAULT false, -- Force update flag
  release_notes TEXT, -- Release notes for the update
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_versions_version_code ON app_versions(version_code);
CREATE INDEX IF NOT EXISTS idx_app_versions_created_at ON app_versions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Public can SELECT (for mobile app to check updates)
CREATE POLICY "Public can view app versions"
  ON app_versions FOR SELECT
  TO anon
  USING (true);

-- Policy: Authenticated users can SELECT (for admin panel)
CREATE POLICY "Authenticated can view app versions"
  ON app_versions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT (for admin panel to add versions)
CREATE POLICY "Authenticated can insert app versions"
  ON app_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE (for admin panel to update versions)
CREATE POLICY "Authenticated can update app versions"
  ON app_versions FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can DELETE (for admin panel to delete versions)
CREATE POLICY "Authenticated can delete app versions"
  ON app_versions FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial version record (optional - adjust as needed)
INSERT INTO app_versions (version_code, download_url, is_critical, release_notes)
VALUES (
  '1.0.0',
  'https://zamanmall.netlify.app/Zaman%20Mall.apk',
  false,
  'Initial release of Zaman Mall'
)
ON CONFLICT (version_code) DO NOTHING;
