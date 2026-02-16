import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

interface AuthPageProps {
  type: 'login' | 'signup';
}

export default function AuthPage({ type }: AuthPageProps) {
  const isSignUp = type === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signIn, signUp } = useSupabaseAuth();

  const fromPath = (location.state as { from?: string } | null)?.from ?? '/multiplayer';

  if (!authLoading && user) {
    return <Navigate to={fromPath} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result.needsEmailConfirmation) {
          setMessage('Account created. Check your inbox to confirm your email, then sign in.');
        } else {
          navigate('/multiplayer', { replace: true });
        }
      } else {
        await signIn(email, password);
        navigate(fromPath, { replace: true });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to continue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-wide flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-slate-300">{isSignUp ? 'Create a free account to unlock Multiplayer Sims.' : 'Sign in to access the Multiplayer Sims workspace.'}</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {message && <p className="text-sm text-mint">{message}</p>}
          <button disabled={loading} className="w-full rounded-xl2 bg-mint px-5 py-2.5 font-semibold text-slate-900 disabled:opacity-60">
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isSignUp ? '/login' : '/signup'} className="text-mint hover:text-mint/80">
            {isSignUp ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </div>
    </section>
  );
}
