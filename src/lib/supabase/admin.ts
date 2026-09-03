import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv } from "@/lib/env";

export function createServiceClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
