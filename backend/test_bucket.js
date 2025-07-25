import { ensureBucketExists } from './utils/supabaseStorage.js';

// Test bucket creation
async function testBucketCreation() {
    console.log('Testing bucket creation...');
    
    const result = await ensureBucketExists('product-images');
    
    if (result.success) {
        console.log('✅ Bucket creation successful or bucket already exists');
    } else {
        console.log('❌ Bucket creation failed:', result.error);
    }
}

testBucketCreation().catch(console.error);
