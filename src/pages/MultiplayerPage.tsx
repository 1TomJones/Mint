import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { RunRow, fetchUserRuns, getFreshAccessToken } from '../lib/supabase';
import {
  fetchPortfolioScenarioMetadata,
  fetchPublicEvents,
  joinEventByCode,
  type PublicEvent,
  type ScenarioMetadata,
} from '../lib/backendApi';

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return Number(value).toFixed(2);
}

export default function MultiplayerPage() {
  const { user } = useSupabaseAuth();
  const [searchParams] = useSearchParams();
  const [eventCode, setEventCode] = useState('');
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setEventsLoading(true);
        setError(null);

        const metadata = await fetchPortfolioScenarioMetadata();
        setScenarios(metadata);
        setScenarioError(null);
      } catch (loadError) {
        console.error('[MultiplayerPage] Failed to load scenario metadata', loadError);
        setScenarioError(loadError instanceof Error ? loadError.message : 'Cannot load scenarios');
      }

      try {
        const eventsData = await fetchPublicEvents();
        setEvents(eventsData.events);
      } catch (loadError) {
        console.error('[MultiplayerPage] Failed to load public events', loadError);
        const message = loadError instanceof Error ? loadError.message : 'Failed to load active events.';

        if (message.includes('HTTP 404')) {
          setEvents([]);
        } else {
          setError(message);
        }
      } finally {
        setEventsLoading(false);
      }

      if (!user) {
        setRunsLoading(false);
        return;
      }

      try {
        setRunsLoading(true);
        const freshAccessToken = await getFreshAccessToken();
        const runsData = await fetchUserRuns(user.id, freshAccessToken);
        setRuns(runsData ?? []);
      } catch (loadError) {
        console.error('[MultiplayerPage] Failed to load run history', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load run history.');
      } finally {
        setRunsLoading(false);
      }
    };

    void load();
  }, [user, reloadKey]);

  const activeEvents = useMemo(
    () => events.filter((event) => ['active', 'running', 'live', 'paused'].includes((event.state ?? '').toLowerCase())),
    [events],
  );
  const scenarioById = useMemo(() => new Map(scenarios.map((scenario) => [scenario.id, scenario.title])), [scenarios]);

  useEffect(() => {
    const prefilledCode = searchParams.get('code');
    if (!prefilledCode) {
      return;
    }

    setEventCode(prefilledCode.toUpperCase());
    setToast(`Code ${prefilledCode.toUpperCase()} loaded into Join input.`);
    const timeoutId = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);
  const liveEvent = activeEvents[0] ?? null;

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError('Please sign in first');
      return;
    }

    if (!eventCode.trim()) {
      return;
    }

    try {
      setJoining(true);
      setError(null);
      const freshAccessToken = await getFreshAccessToken();
      const createdRun = await joinEventByCode(eventCode.trim().toUpperCase(), user.id, freshAccessToken);
      window.location.assign(createdRun.launchUrl);
    } catch (joinError) {
      console.error('[MultiplayerPage] Join event failed', joinError);
      setError(joinError instanceof Error ? joinError.message : 'Unable to join event.');
    } finally {
      setJoining(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleUseEventCode = (code: string) => {
    setEventCode(code);
    setError(null);
    setToast(`Code ${code} loaded into Join input.`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleJoinByCode = async (code: string) => {
    setEventCode(code);
    if (!user) {
      setError('Please sign in first');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      const freshAccessToken = await getFreshAccessToken();
      const createdRun = await joinEventByCode(code.trim().toUpperCase(), user.id, freshAccessToken);
      window.location.assign(createdRun.launchUrl);
    } catch (joinError) {
      console.error('[MultiplayerPage] Join event failed', joinError);
      setError(joinError instanceof Error ? joinError.message : 'Unable to join event.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="container-wide py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Multiplayer Sims</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Event control center</h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          {liveEvent && (
            <article className="rounded-2xl border border-mint/30 bg-slate-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-mint">Live event</p>
              <h2 className="mt-2 text-lg font-semibold">{liveEvent.name}</h2>
              <p className="mt-1 text-sm text-slate-300">Code: {liveEvent.code}</p>
              <button
                type="button"
                onClick={() => handleUseEventCode(liveEvent.code)}
                className="mt-3 rounded-lg border border-mint/40 px-3 py-1.5 text-sm text-mint transition hover:border-mint hover:bg-mint/10"
              >
                Join
              </button>
            </article>
          )}

          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold">Join an event</h2>
            <p className="mt-2 text-sm text-slate-300">Enter your event code to create a run and launch the external simulation.</p>
            {!user && (
              <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-900/20 p-3 text-sm text-amber-200">
                Please sign in first.
              </p>
            )}
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleJoin}>
              <input disabled={!user} value={eventCode} onChange={(event) => setEventCode(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 uppercase disabled:opacity-60" placeholder="Event Code" />
              <button disabled={joining || !user} className="rounded-xl2 bg-mint px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
            {!user && (
              <Link to="/login" className="mt-3 inline-flex text-sm text-mint hover:text-mint/80">
                Sign in to join
              </Link>
            )}
            {toast && <p className="mt-3 text-sm text-mint">{toast}</p>}
            {error && <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>}
            {scenarioError && (
              <div className="mt-3 rounded-lg border border-rose-300/25 bg-rose-900/20 p-3">
                <p className="text-sm text-rose-200">{scenarioError}</p>
                <button
                  type="button"
                  className="mt-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:border-mint/40 hover:text-mint"
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  Retry
                </button>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold">Your runs</h2>
            {runsLoading ? (
              <p className="mt-3 text-sm text-slate-300">Loading your run history…</p>
            ) : !user ? (
              <p className="mt-3 text-sm text-slate-300">Sign in to view your run history.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-white/10">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Event</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">PnL</th>
                      <th className="pb-3 font-medium">Sharpe</th>
                      <th className="pb-3 font-medium">DD</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => {
                      const metrics = run.run_results[0];
                      const status = run.finished_at ? 'completed' : 'active';
                      return (
                        <tr key={run.id} className="border-b border-white/5 text-slate-200">
                          <td className="py-3">{new Date(run.created_at).toLocaleString()}</td>
                          <td className="py-3">{run.events?.name ?? 'Unknown event'}</td>
                          <td className="py-3">{formatMetric(metrics?.score)}</td>
                          <td className="py-3">{formatMetric(metrics?.pnl)}</td>
                          <td className="py-3">{formatMetric(metrics?.sharpe)}</td>
                          <td className="py-3">{formatMetric(metrics?.max_drawdown)}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${run.finished_at ? 'bg-mint/20 text-mint' : 'bg-slate-700 text-slate-200'}`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-3">
                            <Link className="text-mint hover:text-mint/80" to={`/multiplayer/runs/${run.id}`}>
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Active events</h2>
          <div className="mt-4 space-y-3">
            {activeEvents.slice(0, 8).map((event) => {
              const isSelected = eventCode.trim().toUpperCase() === event.code;
              const scenarioTitle = event.scenario_id ? (scenarioById.get(event.scenario_id) ?? event.scenario_id) : '—';

              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleUseEventCode(event.code)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                      keyboardEvent.preventDefault();
                      handleUseEventCode(event.code);
                    }
                  }}
                  className={`w-full rounded-xl border bg-slate-950/60 p-4 text-left transition ${isSelected ? 'border-mint/70 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]' : 'border-white/10 hover:border-mint/40'}`}
                >
                  <p className="text-sm font-medium">{event.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Code: {event.code}</p>
                  <p className="mt-1 text-xs text-slate-300">Scenario: {scenarioTitle}</p>
                  <p className="mt-1 text-xs text-slate-300">Duration: {event.duration_minutes ?? '—'} min</p>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      disabled={joining}
                      onClick={(linkEvent) => {
                        linkEvent.stopPropagation();
                        void handleJoinByCode(event.code);
                      }}
                      className="rounded-lg border border-mint/40 px-3 py-1.5 text-mint disabled:opacity-60"
                    >
                      {joining ? 'Joining…' : 'Join'}
                    </button>
                    <span className="rounded-lg border border-white/20 px-3 py-1.5 text-slate-300">{isSelected ? 'Selected' : 'Select event'}</span>
                    <Link
                      onClick={(linkEvent) => linkEvent.stopPropagation()}
                      className="text-slate-300 hover:text-white"
                      to={`/multiplayer/events/${event.code}`}
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })}
            {eventsLoading ? <p className="text-sm text-slate-400">Loading public active events…</p> : null}
            {!eventsLoading && !activeEvents.length && <p className="text-sm text-slate-400">No public active events right now.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
