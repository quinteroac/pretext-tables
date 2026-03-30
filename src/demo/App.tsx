import type React from 'react'
import { BasicTable, ColumnControlsTable, DraggableTable, ExpandableTable, ResizableTable, VirtualizedTable } from '../tables/index.js'
import type { Row } from '../shared/types.js'
import './demo.css'

// ── Department color map ──────────────────────────────────────────────────
// Each department gets a distinct hue in oklch (uniform lightness/chroma so
// all badges feel equally weighted — no one department "shouts").
const DEPT_COLORS: Record<string, { text: string; bg: string }> = {
  'Engineering':        { text: 'oklch(68% 0.08 240)', bg: 'oklch(16% 0.03 240)' },
  'Platform':           { text: 'oklch(68% 0.08 280)', bg: 'oklch(16% 0.03 280)' },
  'Design':             { text: 'oklch(68% 0.08 350)', bg: 'oklch(16% 0.03 350)' },
  'Analytics':          { text: 'oklch(68% 0.08 185)', bg: 'oklch(16% 0.03 185)' },
  'Infrastructure':     { text: 'oklch(68% 0.08 50)',  bg: 'oklch(16% 0.03 50)'  },
  'Product':            { text: 'oklch(68% 0.08 140)', bg: 'oklch(16% 0.03 140)' },
  'Security':           { text: 'oklch(68% 0.08 15)',  bg: 'oklch(16% 0.03 15)'  },
  'Customer Success':   { text: 'oklch(68% 0.08 160)', bg: 'oklch(16% 0.03 160)' },
  'Mobile':             { text: 'oklch(68% 0.08 295)', bg: 'oklch(16% 0.03 295)' },
  'Documentation':      { text: 'oklch(68% 0.08 225)', bg: 'oklch(16% 0.03 225)' },
  'Quality Assurance':  { text: 'oklch(68% 0.08 90)',  bg: 'oklch(16% 0.03 90)'  },
  'Data Science':       { text: 'oklch(68% 0.08 200)', bg: 'oklch(16% 0.03 200)' },
  'DevOps':             { text: 'oklch(68% 0.08 55)',  bg: 'oklch(16% 0.03 55)'  },
  'Finance':            { text: 'oklch(68% 0.08 155)', bg: 'oklch(16% 0.03 155)' },
  'Legal':              { text: 'oklch(68% 0.08 260)', bg: 'oklch(16% 0.03 260)' },
}

function renderDeptCell(value: string, _rowIndex: number, colIndex: number): React.ReactNode {
  if (colIndex !== 2) return value
  const colors = DEPT_COLORS[value]
  if (!colors) return value
  return (
    <span
      className="demo-dept-badge"
      style={{ color: colors.text, background: colors.bg }}
    >
      {value}
    </span>
  )
}

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
        <div className="demo-wordmark">pretext-tables</div>
        <h1 className="demo-title">
          Measure text.<br />
          <em>Skip the DOM.</em>
        </h1>
        <p className="demo-subtitle">
          Five table components powered by{' '}
          <code className="demo-code">@chenglou/pretext</code> — row heights
          calculated before the browser renders. No DOM reads. No layout
          reflows.
        </p>
        <div className="demo-stats">
          <div className="demo-stat">
            <div className="demo-stat-value demo-stat-value--good">0</div>
            <div className="demo-stat-label">DOM reflows</div>
          </div>
          <div className="demo-stat">
            <div className="demo-stat-value">6</div>
            <div className="demo-stat-label">components</div>
          </div>
          <div className="demo-stat">
            <div className="demo-stat-value demo-stat-value--info">1</div>
            <div className="demo-stat-label">measure pass</div>
          </div>
          <div className="demo-stat">
            <div className="demo-stat-value demo-stat-value--good">∞</div>
            <div className="demo-stat-label">layout calls saved</div>
          </div>
        </div>
      </header>

      <main className="demo-main">
        <section className="demo-section">
          <span className="demo-section-eyebrow">Basic · Fixed widths</span>
          <h2 className="demo-section-title">BasicTable</h2>
          <p className="demo-section-desc">
            Fixed column widths, variable-height rows. Text wraps correctly
            without ever measuring the DOM.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name · 200px</span>
            <span className="demo-pill">Role Summary · 300px</span>
            <span className="demo-pill">Department · 220px</span>
          </div>

          <div className="demo-table-wrapper demo-table-wrapper--fit">
            <BasicTable rows={ROWS} columnWidths={COLUMN_WIDTHS} renderCell={renderDeptCell} />
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Expandable · Proportional scaling</span>
          <h2 className="demo-section-title">ExpandableTable</h2>
          <p className="demo-section-desc">
            Drag the right edge of the table to resize it. All columns scale
            proportionally and row heights update instantly — no DOM reads
            needed.
          </p>
          <div className="demo-table-wrapper">
            <ExpandableTable
              rows={ROWS}
              headers={EXPANDABLE_HEADERS}
              defaultColumnWidths={EXPANDABLE_DEFAULT_WIDTHS}
              renderCell={renderDeptCell}
            />
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Resizable · Column + row handles</span>
          <h2 className="demo-section-title">ResizableTable</h2>
          <p className="demo-section-desc">
            Drag a column's right edge to resize it. Drag the bottom of any
            row to set a custom height.
          </p>
          <div className="demo-table-wrapper">
            <ResizableTable
              rows={ROWS}
              headers={RESIZABLE_HEADERS}
              defaultColumnWidths={RESIZABLE_DEFAULT_WIDTHS}
              horizontal
              vertical
              renderCell={renderDeptCell}
            />
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Virtual · 500 rows · Windowed</span>
          <h2 className="demo-section-title">VirtualizedTable</h2>
          <p className="demo-section-desc">
            500 rows — only the visible rows are in the DOM at any time.
            Because heights are calculated before rendering, the scrollbar is
            perfectly sized from the first frame — no estimation, no layout
            jumps.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name · 180px</span>
            <span className="demo-pill">Role Summary · 340px</span>
            <span className="demo-pill">Department · 160px</span>
          </div>

          <div className="demo-table-wrapper">
            <VirtualizedTable
              rows={VIRTUAL_ROWS}
              columnWidths={VIRTUAL_COLUMN_WIDTHS}
              height={400}
              renderCell={renderDeptCell}
            />
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Sortable + Visibility · Column controls</span>
          <h2 className="demo-section-title">ColumnControlsTable</h2>
          <p className="demo-section-desc">
            Toggle columns on/off with the checkboxes above the table. Click
            any header to sort. Hidden columns are fully removed from layout
            and measurement — at least one column always stays visible.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name · 200px</span>
            <span className="demo-pill">Role Summary · 300px</span>
            <span className="demo-pill">Department · 220px</span>
          </div>

          <div className="demo-table-wrapper demo-table-wrapper--fit">
            <ColumnControlsTable
              rows={ROWS}
              columns={[
                { id: 'name', label: 'Name' },
                { id: 'role', label: 'Role Summary' },
                { id: 'dept', label: 'Department' },
              ]}
              columnWidths={COLUMN_WIDTHS}
              renderCell={renderDeptCell}
            />
          </div>
        </section>

        <DraggableDemo />
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraggableDemo — shows <DraggableTable> first, then hook-only composition
// ---------------------------------------------------------------------------

const DRAGGABLE_ROWS: Row[] = [
  { id: 'd1', cells: ['Alice Johnson', 'Leads the frontend architecture team and establishes coding standards.', 'Engineering'] },
  { id: 'd2', cells: ['Bob Martinez', 'Works on backend API design with a focus on performance and scalability.', 'Platform'] },
  { id: 'd3', cells: ['Carol White', 'Manages the design system and ensures visual consistency across surfaces.', 'Design'] },
  { id: 'd4', cells: ['David Kim', 'Full-stack engineer who owns the billing and subscription management subsystem.', 'Engineering'] },
  { id: 'd5', cells: ['Eva Schulz', 'Data analyst responsible for building dashboards and running A/B test analyses.', 'Analytics'] },
]

const DRAGGABLE_COLUMN_WIDTHS = [160, 300, 140]
const DRAGGABLE_HEADERS = ['Name', 'Role Summary', 'Department']

function DraggableDemo() {
  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Draggable · Row + column reorder</span>
      <h2 className="demo-section-title">DraggableTable</h2>
      <p className="demo-section-desc">
        Drag any row or column header to reorder it. Uses native browser
        drag-and-drop — no extra library needed. Row heights stay correct
        through every reorder.
      </p>

      <div className="demo-table-wrapper">
        <DraggableTable
          rows={DRAGGABLE_ROWS}
          headers={DRAGGABLE_HEADERS}
          columnWidths={DRAGGABLE_COLUMN_WIDTHS}
          renderCell={renderDeptCell}
        />
      </div>

    </section>
  )
}
