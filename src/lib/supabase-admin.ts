/**
 * supabase-admin.ts — Service-role Supabase client for server-side use ONLY.
 *
 * The service role key bypasses Row Level Security, so this file must
 * NEVER be imported in client components or exposed to the browser.
 * Only use in: API route handlers, cron jobs, server actions.
 */
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      // Disable automatic session persistence — this is a server client
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
