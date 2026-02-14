import { Link } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint/90">Membership</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Upgrade required</h3>
        <p className="mt-3 text-slate-300">This pathway is part of the Pro tier.</p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/pricing"
            className="inline-flex rounded-xl2 bg-mint px-4 py-2 text-sm font-semibold text-slate-900 transition hover:shadow-glow"
          >
            View Plans
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-xl2 border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
