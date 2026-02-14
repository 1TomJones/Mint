import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PageHero, Surface } from './Shared';
import { pathways, umbrellaOrder } from '../data/pathwaysData';
import { useAuthMock } from '../context/AuthMockContext';
import { canAccessPathway } from './pathways/pathwayAccess';
import UpgradeModal from '../components/pathways/UpgradeModal';
import DevAuthToggle from '../components/pathways/DevAuthToggle';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
    </svg>
  );
}

export default function PathwaysPage() {
  const { isLoggedIn, plan } = useAuthMock();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const groupedPathways = useMemo(
    () =>
      umbrellaOrder.map((umbrella) => ({
        umbrella,
        items: pathways.filter((pathway) => pathway.umbrella === umbrella),
      })),
    [],
  );

  const handleStart = (pathwayId: string, accessLevel: 'free' | 'pro') => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!canAccessPathway(isLoggedIn, plan, accessLevel)) {
      setUpgradeOpen(true);
      return;
    }

    navigate(`/pathways/${pathwayId}`);
  };

  return (
    <>
      <PageHero
        title="Pathways"
        subtitle="Structured finance training organized by umbrella, pathway, and progressive levels."
      />

      <section className="container-wide pb-20">
        <div className="mb-8">
          <DevAuthToggle />
        </div>

        <div className="space-y-8">
          {groupedPathways.map(({ umbrella, items }) => (
            <Surface key={umbrella}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight">{umbrella}</h2>
                <p className="text-sm text-slate-400">{items.length} pathways</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((pathway) => {
                  const hasAccess = canAccessPathway(isLoggedIn, plan, pathway.accessLevel);
                  const locked = !hasAccess;

                  return (
                    <article
                      key={pathway.id}
                      className="group rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition duration-200 hover:border-mint/30 hover:bg-slate-900/80"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {pathway.accessLevel.toUpperCase()}
                        </p>
                        {locked && <LockIcon />}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{pathway.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">{pathway.tagline}</p>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
                        <span>{pathway.estimatedTime}</span>
                        {locked && isLoggedIn && pathway.accessLevel === 'pro' ? (
                          <span className="text-mint/90">Upgrade to access</span>
                        ) : (
                          <Link to={`/pathways/${pathway.id}`} className="text-slate-300 transition group-hover:text-mint">
                            View pathway
                          </Link>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStart(pathway.id, pathway.accessLevel)}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl2 border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/40 hover:text-mint"
                      >
                        Start
                      </button>
                    </article>
                  );
                })}
              </div>
            </Surface>
          ))}
        </div>
      </section>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
