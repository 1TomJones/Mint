import { SecondaryButton } from '../components/Buttons';
import { PageHero, Surface } from './Shared';

export default function MISPage() {
  return (
    <>
      <PageHero title="MIS Vault" subtitle="A premium research and strategy layer, released selectively." />
      <section className="container-wide pb-20">
        <Surface>
          <p className="max-w-2xl text-slate-300">MIS remains intentionally minimal in public view. Approved members receive private releases, strategic memos, and high-context framework notes.</p>
          <div className="mt-6"><SecondaryButton href="/contact">Request access</SecondaryButton></div>
        </Surface>
      </section>
    </>
  );
}
