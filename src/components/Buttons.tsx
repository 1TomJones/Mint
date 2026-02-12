import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

export function PrimaryButton({ children, href }: { children: ReactNode; href: string }) {
  const base = 'inline-flex items-center justify-center rounded-xl2 px-5 py-2.5 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink';
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${base} bg-mint text-slate-900 hover:shadow-glow`}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={`${base} bg-mint text-slate-900 hover:shadow-glow`}>
      {children}
    </Link>
  );
}

export function SecondaryButton({ children, href }: { children: ReactNode; href: string }) {
  const base = 'inline-flex items-center justify-center rounded-xl2 border border-white/15 px-5 py-2.5 text-sm font-semibold transition duration-300 hover:border-mint/50 hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink';
  return <Link to={href} className={base}>{children}</Link>;
}
