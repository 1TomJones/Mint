export type AccessLevel = 'free' | 'pro';
export type SimulationStatus = 'COMING SOON' | 'LIVE' | 'BETA';

export interface SimulationItem {
  id: string;
  title: string;
  description: string;
  status: SimulationStatus;
}

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  simulation: SimulationItem;
}

export interface LevelItem {
  id: string;
  title: string;
  summary: string;
  modules: ModuleItem[];
}

export interface Pathway {
  id: string;
  umbrella: 'Investing' | 'Trading' | 'Banking & Financial System' | 'Employability';
  title: string;
  tagline: string;
  description: string;
  estimatedTime: string;
  accessLevel: AccessLevel;
  progress: number;
  levels: LevelItem[];
}

export const pathways: Pathway[] = [
  {
    id: 'portfolio-foundations',
    umbrella: 'Investing',
    title: 'Portfolio Foundations',
    tagline: 'Build durable portfolio construction habits.',
    description: 'Learn allocation discipline, position sizing structure, and governance principles used in institutional portfolio design.',
    estimatedTime: '4h 20m',
    accessLevel: 'free',
    progress: 34,
    levels: [
      {
        id: 'pf-level-1',
        title: 'Level 1 · Portfolio Architecture',
        summary: 'Core allocation models and risk framing.',
        modules: [
          {
            id: 'pf-m1',
            title: 'Allocation Frameworks',
            description: 'Understand strategic vs tactical allocation approaches and when to use each.',
            completed: true,
            simulation: {
              id: 'pf-sim-1',
              title: 'Allocation Constructor',
              description: 'Test allocation mixes under shifting market assumptions.',
              status: 'LIVE',
            },
          },
          {
            id: 'pf-m2',
            title: 'Risk Budgeting Basics',
            description: 'Set and monitor risk budgets across asset classes and mandates.',
            simulation: {
              id: 'pf-sim-2',
              title: 'Risk Budget Sandbox',
              description: 'Adjust limits and review expected drawdown behavior.',
              status: 'BETA',
            },
          },
        ],
      },
      {
        id: 'pf-level-2',
        title: 'Level 2 · Portfolio Governance',
        summary: 'Rebalancing cadence and review routines.',
        modules: [
          {
            id: 'pf-m3',
            title: 'Rebalancing Process',
            description: 'Design a repeatable rebalancing framework with clear thresholds.',
            simulation: {
              id: 'pf-sim-3',
              title: 'Rebalance Drill',
              description: 'Run quarterly rebalance decisions across multiple regimes.',
              status: 'COMING SOON',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'market-cycles',
    umbrella: 'Investing',
    title: 'Market Cycles',
    tagline: 'Interpret market phases with confidence and structure.',
    description: 'Map market cycle behavior, identify phase transitions, and align portfolio posture with macro signals.',
    estimatedTime: '3h 40m',
    accessLevel: 'free',
    progress: 12,
    levels: [
      {
        id: 'mc-level-1',
        title: 'Level 1 · Cycle Recognition',
        summary: 'Signals for expansion, slowdown, stress, and recovery.',
        modules: [
          {
            id: 'mc-m1',
            title: 'Phase Identification',
            description: 'Classify cycle phases using rates, earnings, and volatility context.',
            simulation: {
              id: 'mc-sim-1',
              title: 'Cycle Mapper',
              description: 'Practice assigning regimes to real macro snapshots.',
              status: 'LIVE',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'trading-core',
    umbrella: 'Trading',
    title: 'Trading Core',
    tagline: 'Develop a process-first trading workflow.',
    description: 'Train execution discipline, risk controls, and trade review routines to support consistent decision quality.',
    estimatedTime: '5h 05m',
    accessLevel: 'free',
    progress: 48,
    levels: [
      {
        id: 'tc-level-1',
        title: 'Level 1 · Trade Planning',
        summary: 'Setup quality, invalidation, and expected value.',
        modules: [
          {
            id: 'tc-m1',
            title: 'Setup Qualification',
            description: 'Define objective setup criteria and avoid discretionary drift.',
            completed: true,
            simulation: {
              id: 'tc-sim-1',
              title: 'Setup Evaluator',
              description: 'Score setup quality and filter low-conviction trades.',
              status: 'LIVE',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'live-trading-arena',
    umbrella: 'Trading',
    title: 'Live Trading Arena',
    tagline: 'Professional scenario drills in live conditions.',
    description: 'Advance through structured real-time simulations built for timing, pressure handling, and execution precision.',
    estimatedTime: '6h 15m',
    accessLevel: 'pro',
    progress: 0,
    levels: [
      {
        id: 'lta-level-1',
        title: 'Level 1 · Live Session Drills',
        summary: 'Practice structured execution under real market tempo.',
        modules: [
          {
            id: 'lta-m1',
            title: 'Opening Session Response',
            description: 'Manage entries during early-session volatility and spread shifts.',
            simulation: {
              id: 'lta-sim-1',
              title: 'Opening Bell Arena',
              description: 'Execute a pre-defined playbook during simulated live tape.',
              status: 'COMING SOON',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'run-a-bank',
    umbrella: 'Banking & Financial System',
    title: 'Run a Bank',
    tagline: 'Understand balance sheet decisions in context.',
    description: 'Operate a bank through credit, liquidity, and regulatory choices with institution-style decision frameworks.',
    estimatedTime: '4h 55m',
    accessLevel: 'pro',
    progress: 0,
    levels: [
      {
        id: 'rb-level-1',
        title: 'Level 1 · Balance Sheet Foundations',
        summary: 'Funding mix, loan books, and capital constraints.',
        modules: [
          {
            id: 'rb-m1',
            title: 'Liquidity Coverage',
            description: 'Monitor liquidity ratios and choose stabilizing interventions.',
            simulation: {
              id: 'rb-sim-1',
              title: 'Liquidity Desk Simulator',
              description: 'Stress-test funding decisions through changing deposit behavior.',
              status: 'BETA',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'cv-interview-toolkit',
    umbrella: 'Employability',
    title: 'CV & Interview Toolkit',
    tagline: 'Position your experience with institutional clarity.',
    description: 'Turn your financial experience into sharp, role-aligned materials and structured interview responses.',
    estimatedTime: '2h 30m',
    accessLevel: 'free',
    progress: 64,
    levels: [
      {
        id: 'cit-level-1',
        title: 'Level 1 · Application Materials',
        summary: 'Resources for high-quality finance applications.',
        modules: [
          {
            id: 'cit-m1',
            title: 'Example CVs',
            description: 'Review sample CV structures for analyst and associate pathways.',
            completed: true,
            simulation: {
              id: 'cit-resource-1',
              title: 'CV Resource Pack',
              description: 'Curated templates and formatting guidance for finance roles.',
              status: 'LIVE',
            },
          },
          {
            id: 'cit-m2',
            title: 'Interview Frameworks',
            description: 'Use structured response frameworks for technical and behavioral questions.',
            simulation: {
              id: 'cit-resource-2',
              title: 'Interview Framework Library',
              description: 'Question banks and framework cards for interview preparation.',
              status: 'COMING SOON',
            },
          },
        ],
      },
    ],
  },
];

export const umbrellaOrder: Pathway['umbrella'][] = ['Investing', 'Trading', 'Banking & Financial System', 'Employability'];
