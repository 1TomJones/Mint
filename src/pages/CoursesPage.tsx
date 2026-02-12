import { PageHero, Surface } from './Shared';

export default function CoursesPage() {
  return (
    <>
      <PageHero title="Courses" subtitle="Modular education built for modern market operators: concise, rigorous, and practical." />
      <section className="container-wide pb-20"><Surface><p className="text-slate-300">Course tracks include foundations, tactical frameworks, and risk architecture with weekly updates.</p></Surface></section>
    </>
  );
}
