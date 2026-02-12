export type ProductBadge = 'LIVE' | 'LIMITED' | 'COURSE' | 'TOOL';

export interface ProductTile {
  title: string;
  description: string;
  badge: ProductBadge;
  image: string;
  href: string;
}

export const socialMetrics = [
  '12k+ simulation runs / month',
  '90+ strategy lessons',
  'Private member cohorts',
  'Selective MIS admissions',
];

export const productTiles: ProductTile[] = [
  {
    title: 'Macro Pulse Simulator',
    description: 'Run scenario paths across rates, sectors, and volatility regimes.',
    badge: 'LIVE',
    image: '/placeholders/pulse.svg',
    href: '/products/simulations',
  },
  {
    title: 'Position Sizing Lab',
    description: 'Train sizing discipline through risk-threshold modules.',
    badge: 'TOOL',
    image: '/placeholders/sizing.svg',
    href: '/products/simulations',
  },
  {
    title: 'Foundation Program',
    description: 'Core market architecture and repeatable analysis frameworks.',
    badge: 'COURSE',
    image: '/placeholders/foundation.svg',
    href: '/products/courses',
  },
  {
    title: 'Live Strategy Cohort',
    description: 'Weekly briefings with structured playbook reviews.',
    badge: 'LIMITED',
    image: '/placeholders/cohort.svg',
    href: '/products/community',
  },
  {
    title: 'Community Leaderboards',
    description: 'Track consistency scores and portfolio process metrics.',
    badge: 'LIVE',
    image: '/placeholders/leaderboard.svg',
    href: '/products/community',
  },
  {
    title: 'MIS Research Layer',
    description: 'Premium research and strategy layer, released selectively.',
    badge: 'LIMITED',
    image: '/placeholders/mis.svg',
    href: '/products/mis',
  },
];

export const faqItems = [
  {
    q: 'Is this investment advice?',
    a: 'No. Mint provides educational and simulation tools intended for process development.',
  },
  {
    q: 'Can I use Mint on mobile?',
    a: 'Yes. Every core experience is designed mobile-first and scales cleanly to desktop.',
  },
  {
    q: 'How do I access MIS?',
    a: 'MIS is selective. Submit a request and our team reviews fit before opening access.',
  },
  {
    q: 'Do you offer team plans?',
    a: 'Yes. We support private cohorts and institution-style workflows for teams.',
  },
  {
    q: 'When do simulations update?',
    a: 'Simulation libraries refresh continuously with model and dataset revisions.',
  },
];
