import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Build-time fallback: create a no-op proxy that won't crash during SSR/static export
  supabase = new Proxy({} as SupabaseClient, {
    get() {
      return new Proxy(() => Promise.resolve({ data: null, error: null }), {
        get() {
          return () => Promise.resolve({ data: { session: null, subscription: { unsubscribe: () => {} } }, error: null });
        },
      });
    },
  });
}

export { supabase };
