import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupabaseSession, getCurrentUser, signInWithEmail, signUpWithEmail } from '../lib/supabase';

const STORAGE_KEY = 'mint.supabase.session';

interface AuthUser {
  id: string;
  email?: string;
}

interface SupabaseAuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => void;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function toStoredSession(session: SupabaseSession) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: session.user,
  };
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as { access_token: string; user: AuthUser };
        const currentUser = await getCurrentUser(parsed.access_token);
        setAccessToken(parsed.access_token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      signIn: async (email: string, password: string) => {
        const session = await signInWithEmail(email, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredSession(session)));
        setUser(session.user);
        setAccessToken(session.access_token);
      },
      signUp: async (email: string, password: string) => {
        const result = await signUpWithEmail(email, password);

        if ('access_token' in result) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredSession(result)));
          setUser(result.user);
          setAccessToken(result.access_token);
          return { needsEmailConfirmation: false };
        }

        return { needsEmailConfirmation: true };
      },
      signOut: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setAccessToken(null);
      },
    }),
    [accessToken, loading, user],
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
