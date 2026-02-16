import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  createAdminEvent,
  fetchAdminEvents,
  fetchPortfolioScenarioMetadata,
  updateAdminEventState,
  type AdminEvent,
  type ScenarioMetadata,
} from '../lib/backendApi';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const simBaseUrl = (import.meta.env.VITE_PORTFOLIO_SIM_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function normalizeState(state: string | null | undefined) {
  const normalized = (state ?? 'draft').toLowerCase();
  if (normalized === 'running') {
    return 'live';
  }
  return normalized as 'draft' | 'active' | 'live' | 'paused' | 'ended';
}

function nextCodeSuggestion(events: AdminEvent[]) {
  const used = new Set(events.map((event) => event.code.toUpperCase()));
  for (let i = 1; i <= 99; i += 1) {
    const candidate = `KENTINVEST${String(i).padStart(2, '0')}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  return `KENTINVEST${Date.now().toString().slice(-2)}`;
}

function EventCard({
  event,
  onStateChange,
  onJoinAsAdmin,
  onCopyCode,
  busy,
}: {
  event: AdminEvent;
  onStateChange: (eventCode: string, state: 'draft' | 'active' | 'live' | 'paused' | 'ended') => Promise<void>;
  onJoinAsAdmin: (event: AdminEvent) => void;
  onCopyCode: (eventCode: string) => Promise<void>;
  busy: string | null;
}) {
  const state = normalizeState(event.state);
  const isBusy = busy === event.code;

  const stateBadgeClass: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-100',
    active: 'bg-mint/20 text-mint',
    live: 'bg-emerald-500/20 text-emerald-300',
    paused: 'bg-amber-500/20 text-amber-200',
    ended: 'bg-slate-600 text-slate-100',
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Player code: {event.code}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{event.name}</h3>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${stateBadgeClass[state] ?? stateBadgeClass.draft}`}>
          {state}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <div><dt className="text-slate-400">Sim type</dt><dd>{event.sim_type ?? 'portfolio'}</dd></div>
        <div><dt className="text-slate-400">Scenario</dt><dd>{event.scenario_id ?? '—'}</dd></div>
        <div><dt className="text-slate-400">Created</dt><dd>{new Date(event.created_at).toLocaleString()}</dd></div>
        <div><dt className="text-slate-400">Duration</dt><dd>{event.duration_minutes ?? '—'} min</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'draft' && (
          <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'active')} className="rounded-lg border border-mint/40 px-3 py-1.5 text-xs text-mint disabled:opacity-60">Activate</button>
        )}
        {state === 'active' && (
          <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'live')} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-300 disabled:opacity-60">Start</button>
        )}
        {state === 'live' && (
          <>
            <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'paused')} className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs text-amber-200 disabled:opacity-60">Pause</button>
            <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'ended')} className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-60">End</button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'live')} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-300 disabled:opacity-60">Resume</button>
            <button disabled={isBusy} onClick={() => void onStateChange(event.code, 'ended')} className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-60">End</button>
          </>
        )}
        <button disabled={isBusy} onClick={() => onJoinAsAdmin(event)} className="rounded-lg border border-mint/40 px-3 py-1.5 text-xs text-mint disabled:opacity-60">Join as admin</button>
        <button disabled={isBusy} onClick={() => void onCopyCode(event.code)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-60">Copy Player Code</button>
      </div>
    </article>
  );
}

export default function AdminPage() {
  const { user, accessToken, isAdmin, adminLoading } = useSupabaseAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [actionBusyCode, setActionBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEnded, setShowEnded] = useState(false);
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string; scenarioId?: string }>({});
  const [scenarioLoadError, setScenarioLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: 'KENTINVEST01',
    name: '',
    scenarioId: '',
    durationMinutes: 45,
  });

  const canLoad = !!accessToken && !!user && isAdmin;

  const loadEvents = async () => {
    if (!accessToken) return [];
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminEvents(accessToken);
      setEvents(response.events);
      setForm((current) => (current.code.trim() ? current : { ...current, code: nextCodeSuggestion(response.events) }));
      return response.events;
    } catch (loadError) {
      console.error('[AdminPage] Failed to load admin events', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin events.');
      return [];
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
      try {
        const rows = await fetchPortfolioScenarioMetadata();
        setScenarios(rows);
        setScenarioLoadError(null);
        if (rows.length) {
          setForm((current) => {
            const selected = rows.find((row) => row.id === current.scenarioId) ?? rows[0];
            return {
              ...current,
              scenarioId: current.scenarioId || selected.id,
              durationMinutes: selected.default_duration_minutes ?? current.durationMinutes,
            };
          });
        }
      } catch (loadError) {
        console.error('[AdminPage] metadata fetch failed', loadError);
        setScenarios([]);
        setScenarioLoadError('Cannot load scenarios');
      }
    };

    void loadScenarios();
  }, []);

  const grouped = useMemo(() => {
    const drafts = events.filter((row) => normalizeState(row.state) === 'draft');
    const active = events.filter((row) => normalizeState(row.state) === 'active');
    const running = events.filter((row) => ['live', 'paused'].includes(normalizeState(row.state)));
    const ended = events.filter((row) => normalizeState(row.state) === 'ended');
    return { drafts, active, running, ended };
  }, [events]);

  if (!user) return <Navigate to="/login" replace />;
  if (!adminLoading && !isAdmin) return <Navigate to="/" replace />;

  const selectedScenario = scenarios.find((scenario) => scenario.id === form.scenarioId) ?? null;

  const validateForm = () => {
    const nextErrors: { code?: string; name?: string; scenarioId?: string } = {};
    const normalizedCode = form.code.trim().toUpperCase();

    if (!normalizedCode) {
      nextErrors.code = 'Code is required.';
    } else if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      nextErrors.code = 'Use uppercase letters, numbers, underscore, or hyphen.';
    } else if (events.some((row) => row.code.toUpperCase() === normalizedCode)) {
      nextErrors.code = 'Code must be unique.';
    }

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!form.scenarioId.trim()) {
      nextErrors.scenarioId = 'Scenario is required.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !validateForm()) return;

    try {
      setFormLoading(true);
      setError(null);
      const eventCode = form.code.trim().toUpperCase();
      await createAdminEvent(
        {
          code: eventCode,
          name: form.name.trim(),
          scenario_id: form.scenarioId,
          duration_minutes: Number(form.durationMinutes),
          sim_url: simBaseUrl,
        },
        accessToken,
      );
      setToast(`Event ${eventCode} created.`);
      const latestEvents = await loadEvents();
      setForm((current) => ({
        ...current,
        code: nextCodeSuggestion(latestEvents),
        name: '',
      }));
    } catch (createError) {
      console.error('[AdminPage] create event failed', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create event.');
    } finally {
      setFormLoading(false);
      window.setTimeout(() => setToast(null), 3200);
    }
  };

  const handleStateChange = async (eventCode: string, state: 'draft' | 'active' | 'live' | 'paused' | 'ended') => {
    if (!accessToken) return;
    try {
      setActionBusyCode(eventCode);
      setError(null);
      await updateAdminEventState(eventCode, state, accessToken);
      await loadEvents();
    } catch (changeError) {
      console.error('[AdminPage] state update failed', changeError);
      setError(changeError instanceof Error ? changeError.message : 'Failed to update event state.');
    } finally {
      setActionBusyCode(null);
    }
  };

  const handleJoinAsAdmin = (event: AdminEvent) => {
    try {
      const adminBaseUrl = event.sim_url.endsWith('/') ? `${event.sim_url}admin.html` : `${event.sim_url}/admin.html`;
      const adminUrl = new URL(adminBaseUrl);
      adminUrl.searchParams.set('event_id', event.id);
      adminUrl.searchParams.set('code', event.code);
      if (event.scenario_id) {
        adminUrl.searchParams.set('scenario_id', event.scenario_id);
      }
      window.open(adminUrl.toString(), '_blank', 'noopener,noreferrer');
    } catch (openError) {
      console.error('[AdminPage] failed to open admin URL', openError);
      setError('Could not open admin URL.');
    }
  };

  const handleCopyCode = async (eventCode: string) => {
    try {
      await navigator.clipboard.writeText(eventCode);
      setToast(`Copied ${eventCode}`);
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      setToast(`Code: ${eventCode}`);
      window.setTimeout(() => setToast(null), 2200);
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
          <h2 className="text-lg font-semibold">Create Event</h2>
          <p className="mt-2 text-sm text-slate-300">Available scenarios are fetched from Portfolio Sim metadata.</p>
          <form className="mt-4 space-y-3" onSubmit={handleCreateEvent}>
            <div>
              <input
                value={form.code}
                onChange={(event) => {
                  const nextCode = event.target.value.toUpperCase();
                  setForm((current) => ({ ...current, code: nextCode }));
                  setFormErrors((current) => ({ ...current, code: undefined }));
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 uppercase"
                placeholder="Event code"
                required
              />
              {formErrors.code && <p className="mt-1 text-xs text-rose-300">{formErrors.code}</p>}
            </div>
            <div>
              <input
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setFormErrors((current) => ({ ...current, name: undefined }));
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5"
                placeholder="Event name"
                required
              />
              {formErrors.name && <p className="mt-1 text-xs text-rose-300">{formErrors.name}</p>}
            </div>
            <label className="block text-sm text-slate-300">
              Available scenarios
              <select
                value={form.scenarioId}
                onChange={(event) => {
                  const nextScenario = scenarios.find((scenario) => scenario.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    scenarioId: event.target.value,
                    durationMinutes: nextScenario?.default_duration_minutes ?? current.durationMinutes,
                  }));
                  setFormErrors((current) => ({ ...current, scenarioId: undefined }));
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 disabled:opacity-60"
                required
                disabled={!scenarios.length}
              >
                {!scenarios.length && <option value="">No scenarios available</option>}
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>{scenario.title} ({scenario.default_duration_minutes ?? '—'} min)</option>
                ))}
              </select>
              {formErrors.scenarioId && <p className="mt-1 text-xs text-rose-300">{formErrors.scenarioId}</p>}
            </label>
            {selectedScenario && (
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
                <p className="font-medium text-slate-100">{selectedScenario.title}</p>
                <p className="mt-1">{selectedScenario.description}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">Duration: {selectedScenario.default_duration_minutes ?? form.durationMinutes} minutes</p>
              </div>
            )}
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
            <button disabled={formLoading} className="w-full rounded-xl2 bg-mint px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">
              {formLoading ? 'Creating…' : 'Create Event'}
            </button>
          </form>
          {toast && <p className="mt-3 text-sm text-mint">{toast}</p>}
          {error && <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>}
          {scenarioLoadError && <p className="mt-3 text-sm text-rose-200">{scenarioLoadError}</p>}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Events (all states)</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-300">Loading events…</p>
          ) : (
            <div className="mt-4 space-y-6">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Draft events</h3>
                <div className="mt-3 space-y-3">
                  {grouped.drafts.map((event) => (
                    <EventCard key={event.id} event={event} onStateChange={handleStateChange} onJoinAsAdmin={handleJoinAsAdmin} onCopyCode={handleCopyCode} busy={actionBusyCode} />
                  ))}
                  {!grouped.drafts.length && <p className="text-sm text-slate-400">No draft events.</p>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Active events</h3>
                <div className="mt-3 space-y-3">
                  {grouped.active.map((event) => (
                    <EventCard key={event.id} event={event} onStateChange={handleStateChange} onJoinAsAdmin={handleJoinAsAdmin} onCopyCode={handleCopyCode} busy={actionBusyCode} />
                  ))}
                  {!grouped.active.length && <p className="text-sm text-slate-400">No active events.</p>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Live / running events</h3>
                <div className="mt-3 space-y-3">
                  {grouped.running.map((event) => (
                    <EventCard key={event.id} event={event} onStateChange={handleStateChange} onJoinAsAdmin={handleJoinAsAdmin} onCopyCode={handleCopyCode} busy={actionBusyCode} />
                  ))}
                  {!grouped.running.length && <p className="text-sm text-slate-400">No running events.</p>}
                </div>
              </section>

              <section>
                <button type="button" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300" onClick={() => setShowEnded((current) => !current)}>
                  Ended events {showEnded ? '▲' : '▼'}
                </button>
                {showEnded && (
                  <div className="mt-3 space-y-3">
                    {grouped.ended.map((event) => (
                      <EventCard key={event.id} event={event} onStateChange={handleStateChange} onJoinAsAdmin={handleJoinAsAdmin} onCopyCode={handleCopyCode} busy={actionBusyCode} />
                    ))}
                    {!grouped.ended.length && <p className="text-sm text-slate-400">No ended events.</p>}
                  </div>
                )}
              </section>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
