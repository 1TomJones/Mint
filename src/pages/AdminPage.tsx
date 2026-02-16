import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createAdminEvent, fetchAdminEvents, fetchSimAdminLink } from '../lib/backendApi';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

interface ScenarioOption {
  id: string;
  name: string;
}

const fallbackScenarios: ScenarioOption[] = [
  { id: 'portfolio_basics', name: 'Portfolio Basics' },
  { id: 'macro_rotation', name: 'Macro Rotation' },
  { id: 'risk_off_stress', name: 'Risk-Off Stress' },
];

const simBaseUrl = (import.meta.env.VITE_PORTFOLIO_SIM_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export default function AdminPage() {
  const { user, accessToken, isAdmin, adminLoading } = useSupabaseAuth();
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchAdminEvents>>['events']>([]);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>(fallbackScenarios);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    simType: 'portfolio_sim',
    scenarioId: fallbackScenarios[0].id,
    durationMinutes: 45,
    state: 'draft' as 'draft' | 'active',
  });

  const canLoad = !!accessToken && !!user && isAdmin;

  const loadEvents = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetchAdminEvents(accessToken);
      setEvents(response.events);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoad) {
      setLoading(false);
      return;
    }

    void loadEvents();
  }, [canLoad]);

  useEffect(() => {
    const loadScenarios = async () => {
      if (!simBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${simBaseUrl}/meta/scenarios`);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { scenarios?: Array<{ id?: string; name?: string }> };
        const rows = payload.scenarios
          ?.map((scenario) => ({ id: scenario.id?.trim() ?? '', name: scenario.name?.trim() ?? '' }))
          .filter((scenario) => scenario.id)
          .map((scenario) => ({ id: scenario.id, name: scenario.name || scenario.id }));

        if (rows?.length) {
          setScenarios(rows);
          setForm((current) => ({ ...current, scenarioId: rows[0].id }));
        }
      } catch {
        // keep fallback scenarios when sim meta endpoint is unavailable
      }
    };

    void loadScenarios();
  }, []);

  const stateBadgeClass = useMemo(
    () => ({
      draft: 'bg-slate-700 text-slate-100',
      active: 'bg-mint/20 text-mint',
      live: 'bg-emerald-500/20 text-emerald-300',
      ended: 'bg-amber-500/20 text-amber-200',
    }),
    [],
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!adminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      await createAdminEvent(
        {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          simType: form.simType,
          scenarioId: form.scenarioId,
          durationMinutes: Number(form.durationMinutes),
          state: form.state,
          simUrl: simBaseUrl,
        },
        accessToken,
      );
      setToast(`Event ${form.code.trim().toUpperCase()} created.`);
      setForm((current) => ({ ...current, code: '', name: '' }));
      await loadEvents();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create event.');
    } finally {
      setFormLoading(false);
      window.setTimeout(() => setToast(null), 3200);
    }
  };

  const handleOpenSimAdmin = async (eventCode: string) => {
    if (!accessToken) {
      return;
    }

    try {
      setError(null);
      const response = await fetchSimAdminLink(eventCode, accessToken);
      window.open(response.adminUrl, '_blank', 'noopener,noreferrer');
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'Could not generate sim admin link.');
    }
  };

  return (
    <section className="container-wide py-14">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Multiplayer event management</h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Create new event</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreateEvent}>
            <input
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 uppercase"
              placeholder="Event code"
              required
            />
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5"
              placeholder="Event name"
              required
            />
            <label className="block text-sm text-slate-300">
              Sim type
              <select
                value={form.simType}
                onChange={(event) => setForm((current) => ({ ...current, simType: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              >
                <option value="portfolio_sim">Portfolio Sim</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Scenario
              <select
                value={form.scenarioId}
                onChange={(event) => setForm((current) => ({ ...current, scenarioId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              >
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>{`${scenario.name} (${scenario.id})`}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Duration (minutes)
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5"
                required
              />
            </label>
            <label className="block text-sm text-slate-300">
              Status
              <select
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value as 'draft' | 'active' }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
              </select>
            </label>
            <button disabled={formLoading} className="w-full rounded-xl2 bg-mint px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">
              {formLoading ? 'Creating…' : 'Create event'}
            </button>
          </form>
          {toast && <p className="mt-3 text-sm text-mint">{toast}</p>}
          {error && <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Events</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-300">Loading events…</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Sim Type</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">State</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-white/5">
                      <td className="py-3 font-medium text-slate-100">{event.code}</td>
                      <td className="py-3 text-slate-200">{event.name}</td>
                      <td className="py-3 text-slate-300">{event.sim_type ?? 'portfolio_sim'}</td>
                      <td className="py-3 text-slate-300">{new Date(event.created_at).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${stateBadgeClass[event.state as keyof typeof stateBadgeClass] ?? 'bg-slate-700 text-slate-100'}`}>
                          {event.state ?? 'draft'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/multiplayer?code=${encodeURIComponent(event.code)}`} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:border-mint/40 hover:text-mint">
                            Open Player Join Page
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenSimAdmin(event.code)}
                            className="rounded-lg border border-mint/40 px-3 py-1.5 text-xs text-mint hover:border-mint"
                          >
                            Open Sim Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!events.length && <p className="mt-4 text-sm text-slate-400">No events available yet.</p>}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
