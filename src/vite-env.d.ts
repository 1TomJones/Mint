/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PORTFOLIO_SIM_URL: string;
  readonly VITE_PORTFOLIO_SIM_METADATA_URL: string;
  readonly VITE_ADMIN_ALLOWLIST_EMAILS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
