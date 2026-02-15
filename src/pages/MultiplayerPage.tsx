import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { EventRow, RunRow, fetchEvents, fetchUserRuns } from '../lib/supabase';
import { createRunByCode } from '../lib/backendApi';

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return Number(value).toFixed(2);
}

function formatErrorMessage(message: string) {
  try {
    const parsed = JSON.parse(message) as Record<string, unknown>;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return message;
  }
}

export default function MultiplayerPage() {
  const { user, accessToken } = useSupabaseAuth();
  const [eventCode, setEventCode] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!accessToken || !user) {
        return;
      }

      try {
        setLoading(true);
        const [eventsData, runsData] = await Promise.all([fetchEvents(accessToken), fetchUserRuns(user.id, accessToken)]);
        setEvents(eventsData);
        setRuns(runsData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load multiplayer data.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, user]);

  const activeEvents = useMemo(() => events.filter((event) => !event.ends_at || new Date(event.ends_at) > new Date()), [events]);
  const liveEvent = activeEvents[0] ?? null;

  if (!user) {
    return (
      <section className="container-wide py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-panel p-10 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Multiplayer Sims</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">This area is locked.</h1>
          <p className="mt-4 text-slate-300">Sign in to join live university events, launch the simulation, and keep your run history permanently.</p>
          <Link to="/login" className="mt-7 inline-flex rounded-xl2 bg-mint px-5 py-2.5 text-sm font-semibold text-slate-900">
            Sign in to join
          </Link>
        </div>
      </section>
    );
  }

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !eventCode.trim()) {
      return;
    }

    try {
      setJoining(true);
      setError(null);
      const createdRun = await createRunByCode(eventCode.trim().toUpperCase(), user.id, accessToken);
      window.open(createdRun.simUrl, '_blank', 'noopener,noreferrer');
      setToast('Run created — sim opened in new tab');
      setEventCode('');

      const updatedRuns = await fetchUserRuns(user.id, accessToken);
      setRuns(updatedRuns);
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : 'Unable to join event.';
      setError(formatErrorMessage(message));
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
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleJoin}>
              <input value={eventCode} onChange={(event) => setEventCode(event.target.value)} className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 uppercase" placeholder="Event Code" />
              <button disabled={joining} className="rounded-xl2 bg-mint px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
            {toast && <p className="mt-3 text-sm text-mint">{toast}</p>}
            {error && <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-rose-300/20 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</pre>}
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold">Your runs</h2>
            {loading ? (
              <p className="mt-3 text-sm text-slate-300">Loading your run history…</p>
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
            {activeEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm font-medium">{event.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Code: {event.code}</p>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => handleUseEventCode(event.code)}
                    className="rounded-lg border border-mint/40 px-3 py-1.5 text-mint transition hover:border-mint hover:bg-mint/10"
                  >
                    Use code
                  </button>
                  <Link className="text-slate-300 hover:text-white" to={`/multiplayer/events/${event.code}`}>
                    View details
                  </Link>
                </div>
              </div>
            ))}
            {!activeEvents.length && <p className="text-sm text-slate-400">No public active events right now.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
