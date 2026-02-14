import { useAuthMock } from '../../context/AuthMockContext';

export default function DevAuthToggle() {
  const { isLoggedIn, plan, loginAsFree, loginAsPro, logout } = useAuthMock();

  if (!import.meta.env.DEV) {
    return null;
  }

  const stateLabel = isLoggedIn ? `Logged in · ${plan.toUpperCase()}` : 'Logged out';

  return (
    <div className="rounded-2xl border border-mint/20 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint/90">Developer access state</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Logged out
        </button>
        <button
          type="button"
          onClick={loginAsFree}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Free
        </button>
        <button
          type="button"
          onClick={loginAsPro}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Pro
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">Current: {stateLabel}</p>
    </div>
  );
}
