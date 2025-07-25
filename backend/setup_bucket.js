import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Supabase Bucket Setup Instructions');
console.log('=====================================');
console.log('');
console.log('To enable image uploads, you need to create a storage bucket:');
console.log('');
console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
console.log('2. Navigate to Storage > Buckets');
console.log('3. Click "New Bucket"');
console.log('4. Set bucket name: "product-images"');
console.log('5. Enable "Public bucket" option');
console.log('6. Click "Save"');
console.log('');
console.log('Once created, your image upload functionality will work!');
console.log('');

// Test connection
if (supabaseUrl && supabaseServiceKey) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('✅ Supabase configuration found');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  // Try to list buckets
  supabase.storage.listBuckets()
    .then(({ data: buckets, error }) => {
      if (error) {
        console.log('❌ Error connecting to Supabase:', error.message);
      } else {
        console.log('📦 Current buckets:');
        if (buckets.length === 0) {
          console.log('   (No buckets found - please create "product-images" bucket)');
        } else {
          buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} ${bucket.public ? '(public)' : '(private)'}`);
          });
          
          const hasProductImages = buckets.some(b => b.name === 'product-images');
          if (hasProductImages) {
            console.log('');
            console.log('🎉 "product-images" bucket found! Image upload should work.');
          } else {
            console.log('');
            console.log('⚠️  "product-images" bucket not found. Please create it following the instructions above.');
          }
        }
      }
    })
    .catch(console.error);
} else {
  console.log('❌ Supabase configuration missing in .env file');
}
