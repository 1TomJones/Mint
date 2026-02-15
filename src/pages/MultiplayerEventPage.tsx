import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { EventRow, fetchEventByCode } from '../lib/supabase';
import { LeaderboardEntry, fetchEventLeaderboard } from '../lib/backendApi';

export default function MultiplayerEventPage() {
  const { eventCode } = useParams();
  const { accessToken } = useSupabaseAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
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
        const leaderboard = await fetchEventLeaderboard(selected.code, 20);
        setRows(leaderboard.rows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load event leaderboard.');
      }
    };

    void load();
  }, [accessToken, eventCode]);

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
              {rows.map((row) => (
                <tr key={row.runId} className="border-b border-white/5">
                  <td className="py-3">#{row.rank}</td>
                  <td className="py-3">{row.trader}</td>
                  <td className="py-3">{row.score?.toFixed(2) ?? '—'}</td>
                  <td className="py-3">{row.pnl?.toFixed(2) ?? '—'}</td>
                  <td className="py-3">{row.sharpe?.toFixed(2) ?? '—'}</td>
                  <td className="py-3">{row.max_drawdown?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (
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
