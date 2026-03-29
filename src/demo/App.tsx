import { BasicTable } from '../tables/index.js'
import type { Row } from '../shared/types.js'
import './demo.css'

const COLUMN_WIDTHS = [200, 300, 220]

const ROWS: Row[] = [
  {
    id: '1',
    cells: [
      'Alice Johnson',
      'Leads the frontend architecture team and is responsible for establishing coding standards across all product surfaces.',
      'Engineering',
    ],
  },
  {
    id: '2',
    cells: [
      'Bob Martinez',
      'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.',
      'Platform',
    ],
  },
  {
    id: '3',
    cells: [
      'Carol White',
      'Manages the design system and ensures visual consistency from the component library down to individual page layouts.',
      'Design',
    ],
  },
  {
    id: '4',
    cells: [
      'David Kim',
      'Full-stack engineer who primarily owns the billing and subscription management subsystem.',
      'Engineering',
    ],
  },
  {
    id: '5',
    cells: [
      'Eva Schulz',
      'Data analyst responsible for building dashboards, defining metrics, and running A/B test analyses.',
      'Analytics',
    ],
  },
  {
    id: '6',
    cells: [
      'Frank Okafor',
      'DevOps engineer overseeing CI/CD pipelines, container orchestration, and cloud cost optimisation strategies.',
      'Infrastructure',
    ],
  },
  {
    id: '7',
    cells: [
      'Grace Tanaka',
      'Product manager for the core editor experience, gathering user feedback and shaping the feature roadmap for the next two quarters.',
      'Product',
    ],
  },
  {
    id: '8',
    cells: [
      'Hiro Nakamura',
      'Security engineer who performs threat modelling and conducts regular penetration tests on all customer-facing services.',
      'Security',
    ],
  },
  {
    id: '9',
    cells: [
      'Isabel Costa',
      'Customer success manager who works closely with enterprise clients to ensure smooth onboarding and long-term retention.',
      'Customer Success',
    ],
  },
  {
    id: '10',
    cells: [
      'James Li',
      'Mobile engineer building the iOS and Android apps; also maintains the React Native component library shared across platforms.',
      'Mobile',
    ],
  },
  {
    id: '11',
    cells: [
      'Karen Patel',
      'Technical writer who owns all public API documentation, internal runbooks, and the developer-facing changelog.',
      'Documentation',
    ],
  },
  {
    id: '12',
    cells: [
      'Luis Fernandez',
      'QA lead responsible for test strategy, automation frameworks, and coordinating release sign-off across teams.',
      'Quality Assurance',
    ],
  },
]

export function App() {
  return (
    <div className="demo-root">
      <header className="demo-header">
        <h1 className="demo-title">BasicTable Demo</h1>
        <p className="demo-subtitle">
          Cell heights are pre-calculated by{' '}
          <code className="demo-code">@chenglou/pretext</code> — no DOM
          measurement, no layout thrash.
        </p>
      </header>

      <main className="demo-main">
        <section className="demo-section">
          <h2 className="demo-section-title">Team Directory</h2>
          <p className="demo-section-desc">
            12 rows &times; 3 columns. The &ldquo;Role Summary&rdquo; column
            contains long text designed to trigger multi-line wrapping.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name — 200 px</span>
            <span className="demo-pill">Role Summary — 300 px</span>
            <span className="demo-pill">Department — 220 px</span>
          </div>

          <div className="demo-table-wrapper">
            <BasicTable rows={ROWS} columnWidths={COLUMN_WIDTHS} />
          </div>
        </section>
      </main>
    </div>
  )
}
