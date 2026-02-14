import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export type MockPlan = 'free' | 'pro';

interface AuthMockContextValue {
  isLoggedIn: boolean;
  plan: MockPlan;
  loginAsFree: () => void;
  loginAsPro: () => void;
  logout: () => void;
}

const AuthMockContext = createContext<AuthMockContextValue | null>(null);

export function AuthMockProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plan, setPlan] = useState<MockPlan>('free');

  const value = useMemo<AuthMockContextValue>(
    () => ({
      isLoggedIn,
      plan,
      loginAsFree: () => {
        setIsLoggedIn(true);
        setPlan('free');
      },
      loginAsPro: () => {
        setIsLoggedIn(true);
        setPlan('pro');
      },
      logout: () => setIsLoggedIn(false),
    }),
    [isLoggedIn, plan],
  );

  return <AuthMockContext.Provider value={value}>{children}</AuthMockContext.Provider>;
}

export function useAuthMock() {
  const context = useContext(AuthMockContext);
  if (!context) {
    throw new Error('useAuthMock must be used within AuthMockProvider');
  }

  return context;
}
