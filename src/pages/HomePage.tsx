import { Link } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { ProductCard } from '../components/Cards';
import { RevealItem, RevealSection } from '../components/Motion';
import { faqItems, productTiles, socialMetrics } from '../data/mockData';

const pillars = [
  { title: 'Simulations', text: 'Practice execution with risk-first market scenarios.', href: '/products/simulations' },
  { title: 'Education', text: 'Build a professional process with concise modules.', href: '/products/courses' },
  { title: 'Community', text: 'Compete in disciplined leagues and transparent leaderboards.', href: '/products/community' },
];

export default function HomePage() {
  return (
    <>
      <RevealSection className="container-wide grid gap-10 py-16 md:grid-cols-2 md:py-24">
        <RevealItem className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-mint">Mint Investment Strategies</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Sharper strategy, refined through simulation.</h1>
          <p className="max-w-xl text-lg text-slate-300">A premium platform for modern investors to test frameworks, build conviction, and level up with selective research access.</p>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton href="https://example.com">Try a Sim</PrimaryButton>
            <SecondaryButton href="/signup">Create account</SecondaryButton>
          </div>
        </RevealItem>
        <RevealItem>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-4 shadow-glow">
            <div className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-mint/20 blur-3xl" />
            <img src="/placeholders/platform.svg" alt="Mint platform mockup" className="rounded-2xl border border-white/10" />
          </div>
        </RevealItem>
      </RevealSection>

      <RevealSection className="container-wide py-8">
        <RevealItem className="grid gap-3 md:grid-cols-4">
          {socialMetrics.map((metric) => (
            <div key={metric} className="rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-slate-300">{metric}</div>
          ))}
        </RevealItem>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem><h2 className="section-title">Three pillars. One integrated workflow.</h2></RevealItem>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <RevealItem key={pillar.title} className="rounded-3xl border border-white/10 bg-panel p-6">
              <h3 className="text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{pillar.text}</p>
              <Link to={pillar.href} className="mt-5 inline-block text-sm font-semibold text-mint">Explore →</Link>
            </RevealItem>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem><h2 className="section-title">Product showcase</h2></RevealItem>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {productTiles.map((tile) => <RevealItem key={tile.title}><ProductCard tile={tile} /></RevealItem>)}
        </div>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem><h2 className="section-title">How it works</h2></RevealItem>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {['Select a track', 'Run and refine', 'Review with peers'].map((step, i) => (
            <RevealItem key={step} className="rounded-3xl border border-white/10 bg-panel p-6">
              <p className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-mint/40 text-mint">{i + 1}</p>
              <h3 className="text-lg font-semibold">{step}</h3>
              <p className="mt-2 text-sm text-slate-300">Clear modules and consistent feedback loops built for decision-quality improvements.</p>
            </RevealItem>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem className="rounded-3xl border border-mint/20 bg-black px-8 py-12">
          <p className="text-sm uppercase tracking-[0.2em] text-mint">MIS Vault</p>
          <h2 className="mt-4 text-3xl font-semibold">A premium research and strategy layer, released selectively.</h2>
          <p className="mt-4 max-w-2xl text-slate-300">Minimal by design. High-context research notes, framework updates, and private releases for approved members.</p>
          <SecondaryButton href="/contact">Request access</SecondaryButton>
        </RevealItem>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem><h2 className="section-title">Community, elevated</h2></RevealItem>
        <RevealItem className="mt-6 rounded-3xl border border-white/10 bg-panel p-8">
          <p className="text-slate-300">Structured leagues, accountability cohorts, and leaderboards centered on process quality — not noise.</p>
        </RevealItem>
      </RevealSection>

      <RevealSection className="container-wide py-16">
        <RevealItem><h2 className="section-title">FAQ</h2></RevealItem>
        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <RevealItem key={item.q} className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </RevealItem>
          ))}
        </div>
      </RevealSection>
    </>
  );
}
