import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase configuration missing. Image upload will be disabled.');
  console.warn('Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file');
}

let supabase = null;

// Only initialize if env vars are present
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Upload image to Supabase storage bucket and return the public URL
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} fileName - The name for the file (should include extension)
 * @param {string} bucketName - The name of the storage bucket (default: 'product-images')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImageToSupabase = async (fileBuffer, fileName, bucketName = 'product-images') => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured. Skipping image upload.');
      return { success: false, error: 'Supabase not configured' };
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;

    // First, try to upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: 'image/*',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // If bucket doesn't exist, provide helpful message
      if (error.statusCode === '404' && error.message === 'Bucket not found') {
        return { 
          success: false, 
          error: `Storage bucket '${bucketName}' not found. Please create the bucket in your Supabase dashboard.` 
        };
      }
      
      return { success: false, error: error.message };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    return { 
      success: true, 
      url: urlData.publicUrl,
      fileName: uniqueFileName 
    };

  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete image from Supabase storage bucket
 * @param {string} fileName - The file name to delete
 * @param {string} bucketName - The name of the storage bucket (default: 'product-images')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImageFromSupabase = async (fileName, bucketName = 'product-images') => {
  try {
    if (!supabase) {
      console.warn('Supabase not configured. Skipping image deletion.');
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload multiple images to Supabase storage bucket
 * @param {Array} files - Array of {buffer, fileName} objects
 * @param {string} bucketName - The name of the storage bucket (default: 'product-images')
 * @returns {Promise<{success: boolean, urls?: Array, errors?: Array}>}
 */
export const uploadMultipleImagesToSupabase = async (files, bucketName = 'product-images') => {
  try {
    const uploadPromises = files.map(file => 
      uploadImageToSupabase(file.buffer, file.fileName, bucketName)
    );

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    return {
      success: failedUploads.length === 0,
      urls: successfulUploads.map(result => result.url),
      errors: failedUploads.map(result => result.error),
      uploadResults: results
    };

  } catch (error) {
    console.error('Error uploading multiple images:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if bucket exists, if not create it
 * @param {string} bucketName - The name of the storage bucket
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const ensureBucketExists = async (bucketName) => {
  try {
    if (!supabase) {
      console.warn('Supabase not configured. Cannot ensure bucket exists.');
      return { success: false, error: 'Supabase not configured' };
    }

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return { success: false, error: createError.message };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return { success: false, error: error.message };
  }
};

export default {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  uploadMultipleImagesToSupabase,
  ensureBucketExists
};
