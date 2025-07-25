-- Supabase Bucket Creation SQL
-- Run this in your Supabase SQL Editor to create the product-images bucket

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
    'product-images',
    'product-images', 
    true,
    false,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    5242880 -- 5MB limit
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage product-images" ON storage.objects;

-- Allow public read access to product images
CREATE POLICY "Public read product-images" ON storage.objects
FOR SELECT USING ( bucket_id = 'product-images' );

-- Allow service role to manage all operations on product-images bucket
CREATE POLICY "Service role can manage product-images" ON storage.objects
FOR ALL USING ( 
  bucket_id = 'product-images' AND 
  auth.role() = 'service_role'
);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product-images" ON storage.objects
FOR INSERT WITH CHECK ( 
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' 
);

-- Allow users to update their own files
CREATE POLICY "Users can update own product-images" ON storage.objects
FOR UPDATE USING ( 
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' 
);

-- Allow users to delete their own files  
CREATE POLICY "Users can delete own product-images" ON storage.objects
FOR DELETE USING ( 
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' 
);
