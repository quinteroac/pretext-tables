import { BasicTable, ExpandableTable, ResizableTable, VirtualizedTable } from '../tables/index.js'
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

const RESIZABLE_HEADERS = ['Name', 'Role Summary', 'Department']
const RESIZABLE_DEFAULT_WIDTHS = [160, 280, 160]

const EXPANDABLE_HEADERS = ['Name', 'Role Summary', 'Department']
const EXPANDABLE_DEFAULT_WIDTHS = [160, 280, 160]

const VIRTUAL_COLUMN_WIDTHS = [180, 340, 160]

const DEPARTMENTS = [
  'Engineering', 'Platform', 'Design', 'Analytics', 'Infrastructure',
  'Product', 'Security', 'Customer Success', 'Mobile', 'Documentation',
  'Quality Assurance', 'Data Science', 'DevOps', 'Finance', 'Legal',
]

const ROLE_SNIPPETS = [
  'Leads architecture decisions and drives cross-team technical alignment on a daily basis.',
  'Owns the full lifecycle of backend services from design through to production monitoring and on-call.',
  'Collaborates with product managers and designers to deliver user-facing features with high quality.',
  'Builds and maintains internal tooling that improves developer productivity across the organisation.',
  'Reviews pull requests, mentors junior engineers, and runs weekly knowledge-sharing sessions.',
  'Coordinates with external partners to integrate third-party APIs and manage SLA compliance.',
  'Conducts user research, synthesises findings, and translates insights into concrete design decisions.',
  'Maintains automated test suites and investigates flaky tests to ensure reliable CI pipelines.',
  'Writes technical specifications, designs systems for scalability, and leads quarterly planning cycles.',
  'Monitors production dashboards, responds to incidents, and runs post-mortem reviews.',
  'Works closely with the data team to instrument new features and analyse experiment results.',
  'Participates in hiring loops, onboards new team members, and refines engineering processes.',
]

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hiro',
  'Isabel', 'James', 'Karen', 'Luis', 'Maria', 'Nathan', 'Olivia', 'Pedro',
  'Quinn', 'Rosa', 'Sam', 'Tina', 'Umar', 'Vera', 'Will', 'Xia', 'Yuki', 'Zara',
]

const LAST_NAMES = [
  'Johnson', 'Martinez', 'White', 'Kim', 'Schulz', 'Okafor', 'Tanaka',
  'Nakamura', 'Costa', 'Li', 'Patel', 'Fernandez', 'Novak', 'Andersen',
  'Okonkwo', 'Silva', 'Müller', 'Petrov', 'Dubois', 'Yamamoto',
]

function generateVirtualRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]!
    const department = DEPARTMENTS[i % DEPARTMENTS.length]!
    // Every 3rd row gets a long multi-line description to exercise wrapping.
    const baseSnippet = ROLE_SNIPPETS[i % ROLE_SNIPPETS.length]!
    const description = i % 3 === 0
      ? `${baseSnippet} Additionally, takes ownership of quarterly OKR planning for the ${department} team and coordinates cross-functional initiatives that span multiple reporting lines.`
      : baseSnippet
    return { id: String(i + 1), cells: [`${firstName} ${lastName}`, description, department] }
  })
}

const VIRTUAL_ROWS = generateVirtualRows(500)

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

        <section className="demo-section">
          <h2 className="demo-section-title">ExpandableTable</h2>
          <p className="demo-section-desc">
            Drag the right edge of the table to resize the whole container.
            All columns scale proportionally via{' '}
            <code className="demo-code">useExpandable</code> —{' '}
            <code className="demo-code">layout()</code> recalculates row
            heights on every change,{' '}
            <code className="demo-code">prepare()</code> runs once on load.
          </p>
          <div className="demo-table-wrapper">
            <ExpandableTable
              rows={ROWS}
              headers={EXPANDABLE_HEADERS}
              defaultColumnWidths={EXPANDABLE_DEFAULT_WIDTHS}
            />
          </div>
        </section>

        <section className="demo-section">
          <h2 className="demo-section-title">ResizableTable</h2>
          <p className="demo-section-desc">
            Drag a column divider to resize it{' '}
            (<code className="demo-code">useResizable horizontal</code>), or
            drag the bottom edge of any row to override its height{' '}
            (<code className="demo-code">useResizable vertical</code>).
          </p>
          <div className="demo-table-wrapper">
            <ResizableTable
              rows={ROWS}
              headers={RESIZABLE_HEADERS}
              defaultColumnWidths={RESIZABLE_DEFAULT_WIDTHS}
              horizontal
              vertical
            />
          </div>
        </section>

        <section className="demo-section">
          <h2 className="demo-section-title">VirtualizedTable</h2>
          <p className="demo-section-desc">
            500 rows — only the rows visible in the viewport are in the DOM at
            any given time. All row heights are pre-calculated by{' '}
            <code className="demo-code">@chenglou/pretext</code> before any
            rendering, so the total scroll height is exact from the start — no
            estimation, no layout jumps. Every third row has a longer
            description that wraps across multiple lines.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name — 180 px</span>
            <span className="demo-pill">Role Summary — 340 px</span>
            <span className="demo-pill">Department — 160 px</span>
          </div>

          <VirtualizedTable
            rows={VIRTUAL_ROWS}
            columnWidths={VIRTUAL_COLUMN_WIDTHS}
            height={400}
          />
        </section>
      </main>
    </div>
  )
}
