-- Migration to add image columns to Product table
-- Run this SQL in your database if these columns don't exist

-- Add main_image_url column to store the primary product image URL
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS main_image_url TEXT;

-- Add additional_images column to store array of additional image URLs as JSON
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS additional_images JSONB;

-- Add comments for documentation
COMMENT ON COLUMN "Product".main_image_url IS 'URL of the main product image stored in Supabase storage';
COMMENT ON COLUMN "Product".additional_images IS 'JSON array of additional product image URLs stored in Supabase storage';

-- Create an index on main_image_url for faster queries
CREATE INDEX IF NOT EXISTS idx_product_main_image ON "Product"(main_image_url);
