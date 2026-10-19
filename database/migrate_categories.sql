-- Insert existing hardcoded categories into Supabase
-- Run this AFTER running categories_schema.sql

INSERT INTO categories (name, name_urdu, description, image_url, icon_url, is_active, sort_order) VALUES
('Electronics', 'الیکٹرونکس', 'Electronic devices and gadgets', 'https://res.cloudinary.com/demo/image/upload/v1234567890/electronics.png', NULL, true, 1),
('Fashion', 'فیشن', 'Clothing and fashion accessories', 'https://res.cloudinary.com/demo/image/upload/v1234567890/fashion.png', NULL, true, 2),
('Sports', 'کھیل', 'Sports equipment and gear', 'https://res.cloudinary.com/demo/image/upload/v1234567890/sports.png', NULL, true, 3),
('Books', 'کتابیں', 'Books and educational materials', 'https://res.cloudinary.com/demo/image/upload/v1234567890/books.png', NULL, true, 4),
('Home', 'گھر', 'Home and kitchen items', 'https://res.cloudinary.com/demo/image/upload/v1234567890/home.png', NULL, true, 5),
('Islamic', 'اسلامی', 'Islamic products and books', 'https://res.cloudinary.com/demo/image/upload/v1234567890/islamic.png', NULL, true, 6),
('Perfume', 'خوشبو', 'Perfumes and fragrances', 'https://res.cloudinary.com/demo/image/upload/v1234567890/perfume.png', NULL, true, 7),
('Mobile', 'موبائل', 'Mobile phones and accessories', 'https://res.cloudinary.com/demo/image/upload/v1234567890/mobile.png', NULL, true, 8),
('Cosmetics', 'کاسمیٹکس', 'Beauty and cosmetic products', 'https://res.cloudinary.com/demo/image/upload/v1234567890/cosmetics.png', NULL, true, 9),
('Computer', 'کمپیوٹر', 'Computers and laptops', 'https://res.cloudinary.com/demo/image/upload/v1234567890/computer.png', NULL, true, 10),
('Speakers', 'سپیکرز', 'Audio speakers and sound systems', 'https://res.cloudinary.com/demo/image/upload/v1234567890/speakers.png', NULL, true, 11),
('Stationery', 'اسٹیشنری', 'Office and school supplies', 'https://res.cloudinary.com/demo/image/upload/v1234567890/stationery.png', NULL, true, 12),
('Sandals', 'چپل', 'Footwear and sandals', 'https://res.cloudinary.com/demo/image/upload/v1234567890/sandals.png', NULL, true, 13)
ON CONFLICT (name) DO NOTHING;
