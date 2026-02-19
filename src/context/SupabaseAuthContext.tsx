import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser, Session, supabase } from '../lib/supabase';

interface SupabaseAuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  adminError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function toAuthUser(user: AuthUser | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

async function lookupAdminAllowlist(email?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const { data, error } = await supabase
    .from<{ email: string }>('admin_allowlist')
    .select('email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (error) {
        console.error('[auth] failed to get initial session', error);
      }

      const initialSession = data.session ?? null;
      setSession(initialSession);
      setAccessToken(initialSession?.access_token ?? null);
      setUser(toAuthUser(initialSession?.user ?? null));
      setLoading(false);
    };

    void bootstrap();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      if (!active) {
        return;
      }

      setSession(updatedSession ?? null);
      setAccessToken(updatedSession?.access_token ?? null);
      setUser(toAuthUser(updatedSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const resolveAdmin = async () => {
      if (!accessToken || !user) {
        setIsAdmin(false);
        setAdminError(null);
        setAdminLoading(false);
        return;
      }

      try {
        setAdminLoading(true);
        const adminAllowed = await lookupAdminAllowlist(user.email);
        setIsAdmin(adminAllowed);
        setAdminError(null);
      } catch (error) {
        console.error('[auth] failed to resolve admin status from admin_allowlist', error);
        const detail = error instanceof Error ? error.message : String(error);
        setIsAdmin(false);
        setAdminError(detail);
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
      adminError,
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw new Error(error.message);
        }
      },
      signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw new Error(error.message);
        }

        return { needsEmailConfirmation: !data.session };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw new Error(error.message);
        }
        setSession(null);
        setUser(null);
        setAccessToken(null);
        setIsAdmin(false);
        setAdminError(null);
      },
    }),
    [accessToken, adminError, adminLoading, isAdmin, loading, session, user],
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
