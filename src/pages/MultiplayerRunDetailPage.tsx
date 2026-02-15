import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { fetchRunDetail, RunDetail } from '../lib/supabase';
import { BackendRunDetail, fetchRunDetailById } from '../lib/backendApi';

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return value.toFixed(2);
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function toRunDetail(data: BackendRunDetail): RunDetail {
  return {
    id: data.id,
    created_at: data.created_at,
    finished_at: data.finished_at,
    events: data.events,
    run_results: data.run_results,
  };
}

export default function MultiplayerRunDetailPage() {
  const { runId } = useParams();
  const { accessToken, user } = useSupabaseAuth();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!runId || !accessToken) {
        return;
      }

      try {
        setError(null);
        const response = await fetchRunDetailById(runId, accessToken, user?.id);
        setRun(toRunDetail(response.run));
      } catch {
        try {
          const fallback = await fetchRunDetail(runId, accessToken);
          setRun(fallback[0] ?? null);
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load run details.');
        }
      }
    };

    void load();
  }, [accessToken, runId, user?.id]);

  if (error) {
    return <section className="container-wide py-16 text-rose-300">{error}</section>;
  }

  if (!run) {
    return <section className="container-wide py-16 text-slate-300">Loading run details…</section>;
  }

  const metrics = run.run_results[0];
  const isCompleted = Boolean(run.finished_at);

  return (
    <section className="container-wide py-14">
      <div className="flex flex-wrap gap-3">
        <Link to="/multiplayer" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-mint/50 hover:text-mint">
          Back to Multiplayer
        </Link>
        {isCompleted && run.events?.code && (
          <Link
            to={`/multiplayer/events/${run.events.code}`}
            className="rounded-lg border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-mint hover:border-mint"
          >
            View event leaderboard
          </Link>
        )}
      </div>

      <header className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Run detail</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{run.events?.name ?? 'Unknown event'}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>{new Date(run.created_at).toLocaleString()}</span>
          <span className={`rounded-full px-2 py-1 text-xs ${isCompleted ? 'bg-mint/20 text-mint' : 'bg-slate-700 text-slate-200'}`}>
            {isCompleted ? 'completed' : 'active'}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Item label="Score" value={formatMetric(metrics?.score)} />
        <Item label="PnL" value={formatMetric(metrics?.pnl)} />
        <Item label="Sharpe" value={formatMetric(metrics?.sharpe)} />
        <Item label="Drawdown" value={formatMetric(metrics?.max_drawdown)} />
        <Item label="Win rate" value={formatMetric(metrics?.win_rate)} />
      </div>

      <article className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-8">
        <h2 className="text-lg font-semibold">Chart panel (coming soon)</h2>
        <p className="mt-2 text-sm text-slate-300">Placeholder for equity curve, drawdown, and position analytics.</p>
      </article>
    </section>
  );
}
