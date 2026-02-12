import { PageHero, Surface } from './Shared';

export default function AboutPage() {
  return (
    <>
      <PageHero title="About Mint" subtitle="Mint Investment Strategies builds modern tools for disciplined decision-making." />
      <section className="container-wide pb-20"><Surface><p className="text-slate-300">Our focus is clear: simulations, structured learning, and premium strategy layers that help investors operate with precision.</p></Surface></section>
    </>
  );
}
