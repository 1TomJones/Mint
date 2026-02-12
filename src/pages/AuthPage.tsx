interface AuthPageProps {
  type: 'login' | 'signup';
}

export default function AuthPage({ type }: AuthPageProps) {
  const isSignUp = type === 'signup';
  return (
    <section className="container-wide flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-slate-300">{isSignUp ? 'Start with simulations and structured strategy workflows.' : 'Sign in to continue your strategic workspace.'}</p>
        <form className="mt-6 space-y-4">
          {isSignUp && <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Full name" aria-label="Full name" />}
          <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Email" aria-label="Email" />
          <input type="password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Password" aria-label="Password" />
          <button className="w-full rounded-xl2 bg-mint px-5 py-2.5 font-semibold text-slate-900">{isSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
      </div>
    </section>
  );
}
