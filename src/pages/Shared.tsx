import { ReactNode } from 'react';
import { RevealItem, RevealSection } from '../components/Motion';

export function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <RevealSection className="container-wide py-16 md:py-24">
      <RevealItem>
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
      </RevealItem>
      <RevealItem>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">{subtitle}</p>
      </RevealItem>
    </RevealSection>
  );
}

export function Surface({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-panel p-6 md:p-8">{children}</div>;
}
