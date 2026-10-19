-- Add videos column to products table
-- Stores video URLs as JSONB array: [{ videoUrl, thumbnailUrl, title, sortOrder }]

ALTER TABLE products ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Example data structure stored in videos column:
-- [
--   {
--     "videoUrl": "https://res.cloudinary.com/.../video.mp4",
--     "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
--     "title": "Product Demo",
--     "sortOrder": 0
--   }
-- ]
