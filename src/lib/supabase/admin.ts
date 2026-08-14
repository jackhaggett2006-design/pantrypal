import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row-Level Security — use ONLY in
 * trusted server code (Server Actions / Route Handlers), never in the browser.
 * Intended for shared/global writes such as the nutrition cache.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
