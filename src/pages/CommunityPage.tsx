import { PageHero, Surface } from './Shared';

export default function CommunityPage() {
  return (
    <>
      <PageHero title="Community" subtitle="Compete with discipline through leagues, collaborative review rooms, and transparent leaderboards." />
      <section className="container-wide pb-20"><Surface><img src="/placeholders/leaderboard.svg" alt="Community leaderboard preview" className="rounded-2xl border border-white/10" /></Surface></section>
    </>
  );
}
