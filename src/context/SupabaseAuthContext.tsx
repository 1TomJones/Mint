import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAdminStatus } from '../lib/backendApi';
import { SupabaseSession, getCurrentUser, signInWithEmail, signUpWithEmail } from '../lib/supabase';

const STORAGE_KEY = 'mint.supabase.session';
const adminAllowlist = (import.meta.env.VITE_ADMIN_ALLOWLIST_EMAILS as string | undefined)
  ?.split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean) ?? [];

interface AuthUser {
  id: string;
  email?: string;
}

interface StoredSession {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
}

interface SupabaseAuthContextValue {
  user: AuthUser | null;
  session: StoredSession | null;
  accessToken: string | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => void;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function toStoredSession(session: SupabaseSession): StoredSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: session.user,
  };
}

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function isAllowlistedAdmin(email?: string) {
  const normalizedEmail = email?.toLowerCase();
  return !!normalizedEmail && adminAllowlist.includes(normalizedEmail);
}

function emitAuthStateChange() {
  window.dispatchEvent(new CustomEvent('mint-auth-state-change'));
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const stored = readStoredSession();
      if (!stored) {
        if (active) {
          setLoading(false);
          setAdminLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser(stored.access_token);
        if (!active) {
          return;
        }
        setSession(stored);
        setAccessToken(stored.access_token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    const syncSessionState = () => {
      const stored = readStoredSession();
      setSession(stored);
      setAccessToken(stored?.access_token ?? null);
      setUser(stored?.user ?? null);
      setLoading(false);
    };

    window.addEventListener('storage', syncSessionState);
    window.addEventListener('mint-auth-state-change', syncSessionState);

    return () => {
      active = false;
      window.removeEventListener('storage', syncSessionState);
      window.removeEventListener('mint-auth-state-change', syncSessionState);
    };
  }, []);

  useEffect(() => {
    const resolveAdmin = async () => {
      if (!accessToken || !user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      if (isAllowlistedAdmin(user.email)) {
        setIsAdmin(true);
        setAdminLoading(false);
        return;
      }

      try {
        setAdminLoading(true);
        const response = await fetchAdminStatus(accessToken);
        setIsAdmin(response.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    void resolveAdmin();
  }, [accessToken, user]);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      user,
      session,
      accessToken,
      loading,
      isAdmin,
      adminLoading,
      signIn: async (email: string, password: string) => {
        const signedInSession = await signInWithEmail(email, password);
        const stored = toStoredSession(signedInSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        setSession(stored);
        setUser(signedInSession.user);
        setAccessToken(signedInSession.access_token);
        emitAuthStateChange();
      },
      signUp: async (email: string, password: string) => {
        const result = await signUpWithEmail(email, password);

        if ('access_token' in result) {
          const stored = toStoredSession(result);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          setSession(stored);
          setUser(result.user);
          setAccessToken(result.access_token);
          emitAuthStateChange();
          return { needsEmailConfirmation: false };
        }

        return { needsEmailConfirmation: true };
      },
      signOut: () => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setUser(null);
        setAccessToken(null);
        setIsAdmin(false);
        setAdminLoading(false);
        emitAuthStateChange();
      },
    }),
    [accessToken, adminLoading, isAdmin, loading, session, user],
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }

  return context;
}
