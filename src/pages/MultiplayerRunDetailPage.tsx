import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { RunDetail, fetchRunDetail } from '../lib/supabase';

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default function MultiplayerRunDetailPage() {
  const { runId } = useParams();
  const { accessToken } = useSupabaseAuth();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!runId || !accessToken) {
        return;
      }

      try {
        const response = await fetchRunDetail(runId, accessToken);
        setRun(response[0] ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load run details.');
      }
    };

    void load();
  }, [accessToken, runId]);

  if (error) {
    return <section className="container-wide py-16 text-rose-300">{error}</section>;
  }

  if (!run) {
    return <section className="container-wide py-16 text-slate-300">Loading run details…</section>;
  }

  const metrics = run.run_results[0];

  return (
    <section className="container-wide py-14">
      <Link to="/multiplayer" className="text-sm text-mint hover:text-mint/80">← Back to Multiplayer</Link>
      <header className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Run detail</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{run.events?.name ?? 'Unknown event'}</h1>
        <p className="mt-2 text-sm text-slate-300">Run ID: {run.id}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Item label="Score" value={metrics?.score?.toFixed(2) ?? '—'} />
        <Item label="PnL" value={metrics?.pnl?.toFixed(2) ?? '—'} />
        <Item label="Sharpe" value={metrics?.sharpe?.toFixed(2) ?? '—'} />
        <Item label="Max DD" value={metrics?.max_drawdown?.toFixed(2) ?? '—'} />
        <Item label="Win rate" value={metrics?.win_rate?.toFixed(2) ?? '—'} />
      </div>

      <article className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-8">
        <h2 className="text-lg font-semibold">Charts (coming soon)</h2>
        <p className="mt-2 text-sm text-slate-300">Reserved area for equity curve, drawdown, and position analytics.</p>
      </article>
    </section>
  );
}
