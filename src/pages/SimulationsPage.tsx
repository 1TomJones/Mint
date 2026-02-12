import { PageHero, Surface } from './Shared';

export default function SimulationsPage() {
  return (
    <>
      <PageHero title="Simulations" subtitle="Model market conditions, stress-test assumptions, and rehearse execution before capital is at risk." />
      <section className="container-wide pb-20"><Surface><img src="/placeholders/pulse.svg" alt="Simulations dashboard" className="rounded-2xl border border-white/10" /></Surface></section>
    </>
  );
}
