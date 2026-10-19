-- =====================================================
-- ZEELS TABLE - Instagram-style short video reels
-- Run this in Supabase SQL Editor
-- =====================================================
-- NOTE: products.id is TEXT type in this project,
-- so product_id is also TEXT (no foreign key constraint)
-- =====================================================

CREATE TABLE IF NOT EXISTS zeels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Product reference (TEXT to match products.id type)
  product_id    TEXT DEFAULT NULL,

  -- Stats
  likes_count   INTEGER DEFAULT 0,
  views_count   INTEGER DEFAULT 0,

  -- Visibility
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ZEEL LIKES TABLE - track who liked which zeel
-- =====================================================
CREATE TABLE IF NOT EXISTS zeel_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zeel_id    UUID NOT NULL REFERENCES zeels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zeel_id, user_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_zeels_is_active    ON zeels(is_active);
CREATE INDEX IF NOT EXISTS idx_zeels_sort_order   ON zeels(sort_order);
CREATE INDEX IF NOT EXISTS idx_zeels_product_id   ON zeels(product_id);
CREATE INDEX IF NOT EXISTS idx_zeel_likes_zeel_id ON zeel_likes(zeel_id);
CREATE INDEX IF NOT EXISTS idx_zeel_likes_user_id ON zeel_likes(user_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE zeels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zeel_likes  ENABLE ROW LEVEL SECURITY;

-- Anyone can read active zeels
CREATE POLICY "zeels_public_read" ON zeels
  FOR SELECT USING (is_active = TRUE);

-- Admin / service role can do everything
CREATE POLICY "zeels_admin_all" ON zeels
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Authenticated users can like/unlike
CREATE POLICY "zeel_likes_read"   ON zeel_likes FOR SELECT USING (TRUE);
CREATE POLICY "zeel_likes_insert" ON zeel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "zeel_likes_delete" ON zeel_likes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Auto-update updated_at on zeels
-- =====================================================
CREATE OR REPLACE FUNCTION update_zeels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zeels_updated_at
  BEFORE UPDATE ON zeels
  FOR EACH ROW EXECUTE FUNCTION update_zeels_updated_at();

-- =====================================================
-- Function: toggle like atomically
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_zeel_like(p_zeel_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_liked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM zeel_likes WHERE zeel_id = p_zeel_id AND user_id = p_user_id
  ) INTO v_liked;

  IF v_liked THEN
    DELETE FROM zeel_likes WHERE zeel_id = p_zeel_id AND user_id = p_user_id;
    UPDATE zeels SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_zeel_id;
    RETURN json_build_object('liked', FALSE);
  ELSE
    INSERT INTO zeel_likes (zeel_id, user_id) VALUES (p_zeel_id, p_user_id);
    UPDATE zeels SET likes_count = likes_count + 1 WHERE id = p_zeel_id;
    RETURN json_build_object('liked', TRUE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: increment views_count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_zeel_views(p_zeel_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE zeels SET views_count = views_count + 1 WHERE id = p_zeel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
