import { PrimaryButton } from '../components/Buttons';
import { PageHero } from './Shared';

const tiers = [
  { name: 'Core', price: '$39', detail: 'Simulations + starter coursework.' },
  { name: 'Pro', price: '$129', detail: 'Full platform + community leagues.' },
  { name: 'Selective', price: 'Custom', detail: 'MIS access and private cohorts.' },
];

export default function PricingPage() {
  return (
    <>
      <PageHero title="Pricing" subtitle="Simple tiers designed for individual operators and selective advanced access." />
      <section className="container-wide grid gap-6 pb-20 md:grid-cols-3">
        {tiers.map((tier) => (
          <article key={tier.name} className="rounded-3xl border border-white/10 bg-panel p-6">
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <p className="mt-2 text-3xl font-semibold">{tier.price}<span className="text-base text-slate-400">/mo</span></p>
            <p className="mt-3 text-sm text-slate-300">{tier.detail}</p>
            <div className="mt-6"><PrimaryButton href="/signup">Choose plan</PrimaryButton></div>
          </article>
        ))}
      </section>
    </>
  );
}
