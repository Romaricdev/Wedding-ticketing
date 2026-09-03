export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requises.",
    );
  }

  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.",
    );
  }

  return { url, serviceRoleKey };
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Variable DATABASE_URL requise.");
  }

  return databaseUrl;
}

export function getQrTokenPepper() {
  const pepper = process.env.QR_TOKEN_PEPPER ?? process.env.QR_TOKEN_SECRET;

  if (!pepper) {
    throw new Error("Variable QR_TOKEN_PEPPER ou QR_TOKEN_SECRET requise.");
  }

  return pepper;
}

/** Secret HMAC pour les jetons QR déterministes (Phase 5). */
export function getQrTokenSecret() {
  const secret = process.env.QR_TOKEN_SECRET ?? process.env.QR_TOKEN_PEPPER;

  if (!secret) {
    throw new Error("Variable QR_TOKEN_SECRET requise (ou QR_TOKEN_PEPPER en secours).");
  }

  return secret;
}
