import { ProductCard } from '../components/Cards';
import { RevealItem, RevealSection } from '../components/Motion';
import { productTiles } from '../data/mockData';
import { PageHero } from './Shared';

export default function ProductsPage() {
  return (
    <>
      <PageHero title="Products" subtitle="A refined stack of simulations, education, and community systems designed to build strategic discipline." />
      <RevealSection className="container-wide pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {productTiles.map((tile) => <RevealItem key={tile.title}><ProductCard tile={tile} /></RevealItem>)}
        </div>
      </RevealSection>
    </>
  );
}
