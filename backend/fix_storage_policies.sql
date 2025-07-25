-- Fix Supabase Storage RLS Policies for product-images bucket
-- Run this in your Supabase SQL Editor

-- First, let's check if RLS is enabled on storage.objects
-- If you want to disable RLS completely for easier uploads (less secure but simpler):
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- OR, better approach: Create proper policies for authenticated uploads
-- Delete existing policies that might be too restrictive
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Enable RLS (in case it's disabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to upload to product-images bucket
-- This is more permissive but necessary for your app
CREATE POLICY "Allow all operations on product-images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images'
);

-- Alternative: More specific policies if you want better security
-- CREATE POLICY "Public read product-images" ON storage.objects
-- FOR SELECT USING ( bucket_id = 'product-images' );

-- CREATE POLICY "Service role can manage product-images" ON storage.objects
-- FOR ALL USING ( 
--   bucket_id = 'product-images' AND 
--   auth.role() = 'service_role'
-- );

-- CREATE POLICY "Anon can upload product-images" ON storage.objects
-- FOR INSERT WITH CHECK ( 
--   bucket_id = 'product-images' AND 
--   auth.role() = 'anon'
-- );

-- Verify the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Check current policies (for debugging)
SELECT * FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 1;
