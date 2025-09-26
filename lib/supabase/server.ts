import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  // For server components, we'll use the standard client
  // In production, you should use @supabase/ssr for proper cookie handling
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}