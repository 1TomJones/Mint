import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ProductTile } from '../data/mockData';

export function ProductCard({ tile }: { tile: ProductTile }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="group rounded-3xl border border-white/10 bg-panel p-4 transition-all duration-300 hover:border-mint/30 hover:shadow-glow">
      <Link to={tile.href} className="block space-y-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">{tile.badge}</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img src={tile.image} alt={tile.title} className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{tile.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{tile.description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
