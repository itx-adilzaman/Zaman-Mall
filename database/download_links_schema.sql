-- Download Links Management Table
-- Admin panel se website ke footer aur navbar mein download links control karne ke liye

CREATE TABLE IF NOT EXISTS download_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE, -- 'android', 'windows', 'ios'
  download_url TEXT NOT NULL DEFAULT '#',
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT NOT NULL DEFAULT '',         -- e.g. "Android App"
  sub_label TEXT NOT NULL DEFAULT '',     -- e.g. "Free Download ↓"
  version TEXT NOT NULL DEFAULT '',       -- e.g. "v1.2.0"
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default rows insert karo
INSERT INTO download_links (platform, download_url, is_active, label, sub_label, version) VALUES
  ('android', 'https://drive.google.com/file/d/1RREImUr7m2O_q0VI7rT3T6zIGBHGUV2Z/view?usp=sharing', true, 'Android', 'Free Download ↓', 'v1.0.0'),
  ('windows', 'https://drive.google.com/file/d/15kyUbtcxknEn4nPg_JCOajuWR6yixEXD/view?usp=sharing', true, 'Windows', 'Desktop App ↓', 'v1.0.0'),
  ('ios', '#', false, 'iOS App', 'Coming Soon ⏳', '')
ON CONFLICT (platform) DO NOTHING;

-- RLS policies
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "download_links_read_all" ON download_links
  FOR SELECT USING (true);

-- Only authenticated users can update (admin check app level pe hoga)
CREATE POLICY "download_links_update_auth" ON download_links
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_download_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER download_links_updated_at
  BEFORE UPDATE ON download_links
  FOR EACH ROW EXECUTE FUNCTION update_download_links_timestamp();
