export type ProjectCategory = 'All' | 'Web Apps' | 'Commerce' | 'Systems';

export interface ProjectItem {
  id: string;
  title: string;
  client: string;
  category: Exclude<ProjectCategory, 'All'>;
  year: string;
  outcome: string;
  summary: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  imageUrl: string;
  imageAlt: string;
}

export interface ServiceItem {
  index: string;
  title: string;
  description: string;
  deliverableSummary: string;
  wide?: boolean;
}

export interface ProcessStep {
  index: string;
  title: string;
  timeframe: string;
  description: string;
}

export interface StudioMetric {
  value: string;
  label: string;
  context: string;
}

export const HERO_MEDIA = {
  imageUrl: '/src/assets/images/hero_studio_space_1795437838915.jpg',
  imageAlt: 'Sunlit architectural design and engineering studio with oak worktables and concrete columns',
};

export const STUDIO_METRICS: StudioMetric[] = [
  {
    value: '42',
    label: 'Client Launches',
    context: 'Production web releases since 2019',
  },
  {
    value: '0.7s',
    label: 'Median First Paint',
    context: 'Measured across live client storefronts',
  },
  {
    value: '99.95%',
    label: 'Managed Uptime',
    context: 'Rolling 12-month platform availability',
  },
  {
    value: '6 wks',
    label: 'Average First Release',
    context: 'From kickoff to production deployment',
  },
];

export const SERVICES: ServiceItem[] = [
  {
    index: '01.',
    title: 'Web Applications & Client Portals',
    description:
      'Custom React and TypeScript interfaces built around real operational workflows, fast data tables, and dependable state management.',
    deliverableSummary: 'Architecture · Frontend & API · Automated Tests',
    wide: true,
  },
  {
    index: '02.',
    title: 'Design Systems',
    description:
      'Accessible component libraries, clear typography scales, and reusable layout primitives that keep product teams aligned.',
    deliverableSummary: 'Tokens · Component Kit · Documentation',
  },
  {
    index: '03.',
    title: 'Storefronts & Checkout',
    description:
      'High-conversion product catalogs and streamlined purchasing flows engineered for mobile speed and clear merchandising.',
    deliverableSummary: 'Catalog UI · Cart & Checkout · SEO Structure',
  },
  {
    index: '04.',
    title: 'Performance & Accessibility Audits',
    description:
      'Targeted refactoring of slow legacy web apps to resolve layout shifts, keyboard navigation gaps, and bundle bloat without full rewrites.',
    deliverableSummary: 'Core Web Vitals · WCAG AA · Bundle Profiling',
    wide: true,
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'kinetix-desk',
    title: 'Precision Hardware Telemetry Console',
    client: 'Vektor Instruments',
    category: 'Web Apps',
    year: '2026',
    outcome: '3.2x faster dispatch triage across 14 regional labs',
    summary:
      'A unified browser workspace for engineers calibrating industrial test benches and reviewing run histories in real time.',
    challenge:
      'Laboratory technicians previously switched between four disconnected desktop utilities to inspect calibration logs and flag drift.',
    solution:
      'Designed a keyboard-first split workspace with tabular numerical alignment, instant search filtering, and live threshold alerts.',
    deliverables: ['TypeScript Web App', 'Keyboard Navigation System', 'Live Run Inspector'],
    imageUrl: '/src/assets/images/work_analytics_platform_1795437837893.jpg',
    imageAlt: 'Anodized aluminum desktop monitor and precision machined dial on a matte slate desk',
  },
  {
    id: 'forma-objects',
    title: 'Architectural Goods Storefront',
    client: 'Forma Atelier',
    category: 'Commerce',
    year: '2025',
    outcome: '-48% mobile checkout drop-off within 90 days of launch',
    summary:
      'Editorial product discovery and single-page checkout built for a small-batch stoneware and architectural hardware maker.',
    challenge:
      'Heavy unoptimized imagery and a five-step checkout funnel caused high abandonment among mobile visitors.',
    solution:
      'Rebuilt the storefront with crisp 4:3 photography framing, transparent material specs, and an inline slide-over cart.',
    deliverables: ['Custom Storefront', 'Inline Cart & Checkout', 'Material Filter Index'],
    imageUrl: '/src/assets/images/work_commerce_atelier_1795437838701.jpg',
    imageAlt: 'Sculptural matte stoneware vessels and brushed brass hardware on honed travertine',
  },
  {
    id: 'solis-grid',
    title: 'Coastal Microgrid Operations Portal',
    client: 'Solis Energy Research',
    category: 'Systems',
    year: '2025',
    outcome: '+115% qualified municipal partner inquiries in 6 months',
    summary:
      'Public research showcase paired with a partner documentation portal for distributed coastal battery installations.',
    challenge:
      'Municipal planners struggled to evaluate technical site requirements and past installation performance from static PDFs.',
    solution:
      'Created an interactive specification index and structured technical case studies backed by a cohesive design token system.',
    deliverables: ['Design Token System', 'Interactive Spec Index', 'Partner Inquiry Workflow'],
    imageUrl: '/src/assets/images/work_energy_grid_1795437838885.jpg',
    imageAlt: 'Modern timber and glass clean-energy research pavilion overlooking coastal hills at twilight',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    index: '01.',
    title: 'Scope & Architecture',
    timeframe: 'Week 1',
    description:
      'We define the core user journeys, data structure, and technical constraints upfront so nothing gets built twice.',
  },
  {
    index: '02.',
    title: 'Iterative Build',
    timeframe: 'Weeks 2–5',
    description:
      'You test live staging builds each week in a real browser, reviewing copy, responsiveness, and interactive states directly.',
  },
  {
    index: '03.',
    title: 'Launch & Handoff',
    timeframe: 'Week 6',
    description:
      'We ship verified production code with clean component boundaries, automated tests, and documentation your team can own.',
  },
];
