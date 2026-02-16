const readEnv = (value: string | undefined) => (typeof value === 'string' ? value.trim() : '');

export const appEnv = {
  backendUrl: readEnv(import.meta.env.VITE_BACKEND_URL as string | undefined),
  supabaseUrl: readEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined),
  supabaseAnonKey: readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined),
  portfolioSimUrl: readEnv(import.meta.env.VITE_PORTFOLIO_SIM_URL as string | undefined),
  portfolioSimMetadataUrl: readEnv(import.meta.env.VITE_PORTFOLIO_SIM_METADATA_URL as string | undefined),
  adminAllowlistEmails: readEnv(import.meta.env.VITE_ADMIN_ALLOWLIST_EMAILS as string | undefined),
};

export const requiredEnvChecks = [
  { key: 'VITE_BACKEND_URL', present: appEnv.backendUrl.length > 0 },
  { key: 'VITE_SUPABASE_URL', present: appEnv.supabaseUrl.length > 0 },
  { key: 'VITE_SUPABASE_ANON_KEY', present: appEnv.supabaseAnonKey.length > 0 },
  { key: 'VITE_PORTFOLIO_SIM_URL', present: appEnv.portfolioSimUrl.length > 0 },
  { key: 'VITE_PORTFOLIO_SIM_METADATA_URL', present: appEnv.portfolioSimMetadataUrl.length > 0 },
  { key: 'VITE_ADMIN_ALLOWLIST_EMAILS', present: appEnv.adminAllowlistEmails.length > 0 },
] as const;

export function getMissingEnvVars() {
  return requiredEnvChecks.filter((item) => !item.present).map((item) => item.key);
}

export function logEnvDebugStatus() {
  if (!import.meta.env.DEV) {
    return;
  }

  const status = Object.fromEntries(requiredEnvChecks.map((item) => [item.key, item.present]));
  console.info('[env] Required env var presence', status);
}
