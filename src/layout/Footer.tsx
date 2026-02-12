import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="container-wide grid gap-8 md:grid-cols-4">
        <div>
          <p className="text-sm tracking-[0.2em] text-mint">MINT</p>
          <p className="mt-4 text-sm text-slate-400">Institutional-grade learning, simulation, and selective research access.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-200">Product</p>
          <Link to="/products/simulations" className="block text-slate-400 hover:text-mint">Simulations</Link>
          <Link to="/products/courses" className="block text-slate-400 hover:text-mint">Courses</Link>
          <Link to="/products/community" className="block text-slate-400 hover:text-mint">Community</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-200">Company</p>
          <Link to="/about" className="block text-slate-400 hover:text-mint">About</Link>
          <Link to="/pricing" className="block text-slate-400 hover:text-mint">Pricing</Link>
          <Link to="/contact" className="block text-slate-400 hover:text-mint">Contact</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-200">Legal</p>
          <a href="#" className="block text-slate-400 hover:text-mint">Terms</a>
          <a href="#" className="block text-slate-400 hover:text-mint">Privacy</a>
          <a href="#" className="block text-slate-400 hover:text-mint">Disclosures</a>
        </div>
      </div>
    </footer>
  );
}
