
import { createClient } from '@supabase/supabase-js';

// Hardcoded for sandbox environment as requested
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://phxpotatbrtexjtwyokz.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeHBvdGF0YnJ0ZXhqdHd5b2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjE2NjYsImV4cCI6MjA5MDU5NzY2Nn0.7K4FHs2S-ma9UcNKB6MuC6YckyNFetfO_TEzPpmci-4";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key are required. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
