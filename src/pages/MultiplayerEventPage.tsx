import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { EventRow, LeaderboardRow, fetchEventByCode, fetchLeaderboard } from '../lib/supabase';

function maskedName(row: LeaderboardRow) {
  const email = row.users?.email;
  if (!email) {
    return 'Anonymous';
  }

  const [prefix] = email.split('@');
  return `${prefix.slice(0, 2)}***`;
}

export default function MultiplayerEventPage() {
  const { eventCode } = useParams();
  const { accessToken } = useSupabaseAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventCode || !accessToken) {
        return;
      }

      try {
        const eventData = await fetchEventByCode(eventCode, accessToken);
        const selected = eventData[0];
        if (!selected) {
          throw new Error('Event not found.');
        }

        setEvent(selected);
        const leaderboard = await fetchLeaderboard(selected.id, accessToken);
        setRows(leaderboard);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load event leaderboard.');
      }
    };

    void load();
  }, [accessToken, eventCode]);

  const ranking = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aScore = a.run_results[0]?.score ?? Number.NEGATIVE_INFINITY;
      const bScore = b.run_results[0]?.score ?? Number.NEGATIVE_INFINITY;

      if (aScore === bScore) {
        return (b.run_results[0]?.pnl ?? Number.NEGATIVE_INFINITY) - (a.run_results[0]?.pnl ?? Number.NEGATIVE_INFINITY);
      }

      return bScore - aScore;
    });

    let currentRank = 0;
    let previousScore: number | null = null;

    return sorted.slice(0, 20).map((row, index) => {
      const score = row.run_results[0]?.score ?? null;
      if (score !== previousScore) {
        currentRank = index + 1;
        previousScore = score;
      }

      return { rank: currentRank, row };
    });
  }, [rows]);

  if (error) {
    return <section className="container-wide py-16 text-rose-300">{error}</section>;
  }

  if (!event) {
    return <section className="container-wide py-16 text-slate-300">Loading event…</section>;
  }

  return (
    <section className="container-wide py-14">
      <Link to="/multiplayer" className="text-sm text-mint hover:text-mint/80">← Back to Multiplayer</Link>
      <header className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Event</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{event.name}</h1>
        <p className="mt-2 text-sm text-slate-300">Code: {event.code}</p>
      </header>

      <article className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Leaderboard (Top 20)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Trader</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">PnL</th>
                <th className="pb-3 font-medium">Sharpe</th>
                <th className="pb-3 font-medium">Max DD</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ rank, row }) => {
                const metrics = row.run_results[0];
                return (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="py-3">#{rank}</td>
                    <td className="py-3">{maskedName(row)}</td>
                    <td className="py-3">{metrics?.score?.toFixed(2) ?? '—'}</td>
                    <td className="py-3">{metrics?.pnl?.toFixed(2) ?? '—'}</td>
                    <td className="py-3">{metrics?.sharpe?.toFixed(2) ?? '—'}</td>
                    <td className="py-3">{metrics?.max_drawdown?.toFixed(2) ?? '—'}</td>
                  </tr>
                );
              })}
              {!ranking.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-400">No finished runs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
