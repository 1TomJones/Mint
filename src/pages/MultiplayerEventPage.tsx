import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { LeaderboardEntry, fetchEventLeaderboard } from '../lib/backendApi';

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return value.toFixed(2);
}

export default function MultiplayerEventPage() {
  const { eventCode } = useParams();
  const { user } = useSupabaseAuth();
  const [eventName, setEventName] = useState('');
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventCode) {
        return;
      }

      try {
        setError(null);
        const leaderboard = await fetchEventLeaderboard(eventCode, 50);
        setEventName(leaderboard.event.name);
        setRows(leaderboard.rows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load event leaderboard.');
      }
    };

    void load();
  }, [eventCode]);

  if (error) {
    return <section className="container-wide py-16 text-rose-300">{error}</section>;
  }

  if (!eventCode || !eventName) {
    return <section className="container-wide py-16 text-slate-300">Loading event…</section>;
  }

  return (
    <section className="container-wide py-14">
      <Link to="/multiplayer" className="text-sm text-mint hover:text-mint/80">← Back to Multiplayer</Link>
      <header className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Event leaderboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{eventName}</h1>
        <p className="mt-2 text-sm text-slate-300">Code: {eventCode.toUpperCase()}</p>
      </header>

      <article className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Rankings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Player</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">PnL</th>
                <th className="pb-3 font-medium">DD</th>
                <th className="pb-3 font-medium">Played at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCurrentUser = user?.id && row.userId === user.id;
                return (
                  <tr key={row.runId} className={`border-b border-white/5 ${isCurrentUser ? 'bg-mint/10 text-mint' : 'text-slate-200'}`}>
                    <td className="py-3">#{row.rank}</td>
                    <td className="py-3">{row.trader}</td>
                    <td className="py-3">{formatMetric(row.score)}</td>
                    <td className="py-3">{formatMetric(row.pnl)}</td>
                    <td className="py-3">{formatMetric(row.max_drawdown)}</td>
                    <td className="py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
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
