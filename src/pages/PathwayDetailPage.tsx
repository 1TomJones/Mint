import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import UpgradeModal from '../components/pathways/UpgradeModal';
import DevAuthToggle from '../components/pathways/DevAuthToggle';
import { useAuthMock } from '../context/AuthMockContext';
import { pathways } from '../data/pathwaysData';
import { canAccessPathway } from './pathways/pathwayAccess';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PathwayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, plan } = useAuthMock();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const pathway = useMemo(() => pathways.find((item) => item.id === id), [id]);

  if (!pathway) {
    return <Navigate to="/pathways" replace />;
  }

  const hasAccess = canAccessPathway(isLoggedIn, plan, pathway.accessLevel);

  const handleStart = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!hasAccess) {
      setUpgradeOpen(true);
      return;
    }
  };

  return (
    <>
      <section className="container-wide py-14 md:py-18">
        <div className="rounded-3xl border border-white/10 bg-panel p-7 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>{pathway.umbrella}</span>
            <span>•</span>
            <span className="text-mint/90">{pathway.accessLevel.toUpperCase()}</span>
            {!hasAccess && <LockIcon />}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{pathway.title}</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-300">{pathway.tagline}</p>
          <p className="mt-4 max-w-4xl text-slate-400">{pathway.description}</p>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Pathway progress</span>
              <span>{pathway.progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-mint/85" style={{ width: `${pathway.progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide pb-20">
        <div className="mb-8">
          <DevAuthToggle />
        </div>
        <div className="space-y-5">
          {pathway.levels.map((level) => (
            <div key={level.id} className="rounded-3xl border border-white/10 bg-panel/90 p-6 md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">{level.title}</h2>
              <p className="mt-2 text-slate-300">{level.summary}</p>

              <div className="mt-5 space-y-4">
                {level.modules.map((module) => (
                  <article key={module.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">{module.title}</h3>
                      {module.completed && (
                        <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-mint/90">
                          <CheckIcon /> Completed
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{module.description}</p>

                    <div className="mt-4 rounded-xl2 border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{module.simulation.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{module.simulation.description}</p>
                        </div>
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-300">
                          {module.simulation.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleStart}
                        className="mt-4 inline-flex rounded-lg border border-white/15 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-mint"
                      >
                        Start
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
