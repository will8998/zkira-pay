// ─── Base Block Types ───────────────────────────────────

export interface PageHeader {
  label: string;          // "ABOUT"
  title: string;          // "Building the Confidential Layer for Solana"
  description?: string;
}

export interface TextBlock {
  type: 'text';
  paragraphs: string[];
}

export interface BlockquoteBlock {
  type: 'blockquote';
  text: string;
}

export interface SectionHeader {
  type: 'section_header';
  label?: string;         // small mono label like "VALUES"
  title: string;
  subtitle?: string;
}

export interface CardItem {
  icon?: string;          // Material Symbol name e.g. "security"
  iconSvg?: string;       // raw SVG string for custom icons
  label?: string;         // "FEATURE 01"
  title: string;
  description: string;
  link?: string | { text: string; href: string };
  code?: string;          // inline code example
  features?: string[];    // feature bullet points
  stats?: string;         // e.g. "2.5K+ Followers"
  status?: string;        // e.g. "Active", "Coming Soon"
  date?: string;          // e.g. "Feb 15, 2024"
  cta?: { text: string; href: string };
}

export interface CardsBlock {
  type: 'cards';
  heading?: string;
  subtitle?: string;
  columns?: number;       // 2, 3, 4
  items: CardItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQBlock {
  type: 'faq';
  categories: {
    title: string;
    items: FAQItem[];
  }[];
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsBlock {
  type: 'stats';
  items: StatItem[];
}

export interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary';
  icon?: string;
}

export interface CTABlock {
  type: 'cta';
  icon?: string;
  title: string;
  description?: string;
  buttons: CTAButton[];
  footnote?: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  title?: string;
  code: string;
}

export interface ListBlock {
  type: 'list';
  heading?: string;
  style: 'bullet' | 'numbered' | 'check';
  items: string[];
}

export interface TeamMember {
  initial: string;
  role: string;
  description: string;
}

export interface TeamBlock {
  type: 'team';
  heading?: string;
  subtitle?: string;
  members: TeamMember[];
}

export interface TimelineItem {
  version?: string;
  date: string;
  status: 'shipped' | 'in-progress' | 'planned';
  title: string;
  items: string[];
}

export interface TimelineBlock {
  type: 'timeline';
  items: TimelineItem[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  status: string;
  features: { category: string; items: string[] }[];
}

export interface ChangelogBlock {
  type: 'changelog';
  entries: ChangelogEntry[];
}

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalBlock {
  type: 'legal';
  lastUpdated: string;
  sections: LegalSection[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export interface StepsBlock {
  type: 'steps';
  heading?: string;
  items: StepItem[];
}

export interface ComparisonRow {
  feature: string;
  priv: string | boolean;
  traditional: string | boolean;
}

export interface ComparisonBlock {
  type: 'comparison';
  headers: { priv: string; traditional: string };
  rows: ComparisonRow[];
}

export interface ExposureBlock {
  type: 'exposure';
  heading?: string;
  description?: string;
  items: string[];
}

export interface ContactBlock {
  type: 'contact';
  channels: {
    icon: string;
    title: string;
    description: string;
    link: { text: string; href: string };
  }[];
}

export interface BrandAsset {
  label: string;
  description: string;
  preview?: string;
}

export interface BrandBlock {
  type: 'brand';
  assets: BrandAsset[];
  colors: { name: string; hex: string; usage: string }[];
  fonts: { name: string; usage: string; weight: string }[];
}

// ─── Union Type ─────────────────────────────────────────
export type ContentBlock =
  | TextBlock
  | BlockquoteBlock
  | SectionHeader
  | CardsBlock
  | FAQBlock
  | StatsBlock
  | CTABlock
  | CodeBlock
  | ListBlock
  | TeamBlock
  | TimelineBlock
  | ChangelogBlock
  | LegalBlock
  | StepsBlock
  | ComparisonBlock
  | ExposureBlock
  | ContactBlock
  | BrandBlock;

// ─── Page Content Structure ─────────────────────────────
export interface PageContent {
  page_header: PageHeader;
  breadcrumbs?: BreadcrumbItem[];
  sections: ContentBlock[];
}

// ─── Homepage Content (special structure) ───────────────
// Homepage is split across multiple components, so uses named sections
export interface HomePageContent {
  hero: {
    badge: string;
    headline: string[];
    subheadline: string;
    cta_primary: CTAButton;
    cta_secondary: CTAButton;
    features: string[];
  };
  problem: {
    title: string;
    description: string;
    exposure_items: string[];
    cta: CTAButton;
  };
  features: {
    label: string;
    title: string;
    subtitle: string;
    cards: CardItem[];
  };
  how_it_works: {
    label: string;
    title: string;
    steps: StepItem[];
  };
  telegram: {
    label: string;
    title: string;
    description: string;
    commands: { command: string; description: string }[];
    cta: CTAButton;
  };
  trust: {
    label: string;
    title: string;
    items: CardItem[];
  };
  use_cases: {
    label: string;
    title: string;
    cases: { icon: string; title: string; description: string }[];
  };
  developers: {
    label: string;
    title: string;
    description: string;
    code: string;
    cta: CTAButton;
  };
  stats_bar: {
    items: StatItem[];
  };
  faq: {
    label: string;
    title: string;
    items: FAQItem[];
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta_primary: CTAButton;
    cta_secondary: CTAButton;
  };
}

// ─── Blog Post ──────────────────────────────────────────
export interface BlogPostContent {
  slug: string;
  title: string;
  excerpt: string;
  content: string;         // Markdown body
  author: string;
  tags: string[];
  readTime?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}