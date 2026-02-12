import { PageHero } from './Shared';

export default function ContactPage() {
  return (
    <>
      <PageHero title="Contact" subtitle="Tell us what you are building and where Mint can help." />
      <section className="container-wide pb-20">
        <form className="grid gap-4 rounded-3xl border border-white/10 bg-panel p-6 md:grid-cols-2">
          <input className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Name" aria-label="Name" />
          <input className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Email" aria-label="Email" />
          <input className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 md:col-span-2" placeholder="Subject" aria-label="Subject" />
          <textarea className="min-h-32 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 md:col-span-2" placeholder="Message" aria-label="Message" />
          <button className="rounded-xl2 bg-mint px-5 py-2.5 font-semibold text-slate-900 md:col-span-2">Send inquiry</button>
        </form>
      </section>
    </>
  );
}
