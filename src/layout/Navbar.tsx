import { Link, NavLink } from 'react-router-dom';
import { PrimaryButton } from '../components/Buttons';

const navItems = [
  { label: 'Products', href: '/products' },
  { label: 'Community', href: '/products/community' },
  { label: 'MIS', href: '/products/mis' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
      <nav className="container-wide flex h-16 items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-[0.2em] text-mint">MINT</Link>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `text-sm transition ${isActive ? 'text-mint' : 'text-slate-300 hover:text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <PrimaryButton href="https://example.com">Try a Sim</PrimaryButton>
          <Link to="/login" className="rounded-xl2 border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-mint/40 hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
