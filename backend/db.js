// db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Explicitly load the .env file
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Loaded' : 'Not loaded');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables before creating client
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
}

if (!supabaseKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is not set');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
