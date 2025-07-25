🔧 SUPABASE IMAGE UPLOAD FIX GUIDE
=====================================

ISSUE: "new row violates row-level security policy"
This means you're using an ANON key instead of a SERVICE ROLE key.

SOLUTION STEPS:

1. GET THE CORRECT SERVICE ROLE KEY:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings > API
   - Copy the "service_role" key (NOT the "anon public" key)
   - This key should be much longer and start with "eyJ..."

2. UPDATE YOUR .env FILE:
   - Replace the current SUPABASE_SERVICE_ROLE_KEY value
   - Make sure it's the service_role key, not anon key

3. ENSURE BUCKET EXISTS:
   - Go to Storage > Buckets in Supabase dashboard
   - Create bucket named "product-images" if it doesn't exist
   - Make sure it's set to PUBLIC

4. FIX RLS POLICIES (if needed):
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL script in fix_storage_policies.sql

5. RESTART YOUR SERVER:
   - Stop the backend server
   - Start it again to load new environment variables

VERIFICATION:
Run this command to test: node backend/setup_bucket.js

The key difference between anon and service_role keys:
- anon key: Limited permissions, for frontend use
- service_role: Full permissions, for backend operations

Current key role: anon (❌ Wrong for backend)
Needed key role: service_role (✅ Correct for backend)
