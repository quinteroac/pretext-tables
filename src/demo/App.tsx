import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { BasicTable, DraggableTable, ExpandableTable, ResizableTable, VirtualizedTable } from '../tables/index.js'
import type { Row } from '../shared/types.js'
import { useMeasure, useShrinkWrap, useResizable, useResizePreview, useScrollAnchor, useStickyColumns, useColumnControls, useInfiniteScroll, useCanvasCell, useDetachable } from '../shared/hooks/index.js'
import { BODY_FONT, HEADER_FONT } from '../shared/fonts.js'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import './demo.css'

// ---------------------------------------------------------------------------
// CodeSnippet — renders a code block with minimal manual token highlighting
// ---------------------------------------------------------------------------
export function CodeSnippet({ label, code }: { label: string; code: string }) {
  return (
    <div className="demo-snippet">
      <div className="demo-snippet__label">{label}</div>
      <pre className="demo-snippet__pre">{code}</pre>
    </div>
  )
}

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

// ── ColumnControlsTable demo data (5 columns, 12 rows) ───────────────────────
const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  'Active':    { text: 'oklch(68% 0.12 145)', bg: 'oklch(16% 0.04 145)' },
  'Remote':    { text: 'oklch(68% 0.08 200)', bg: 'oklch(16% 0.03 200)' },
  'On Leave':  { text: 'oklch(68% 0.08 55)',  bg: 'oklch(16% 0.03 55)'  },
  'Contract':  { text: 'oklch(68% 0.08 280)', bg: 'oklch(16% 0.03 280)' },
}

const CC_COLUMN_WIDTHS = [190, 300, 160, 120, 160]

const CC_COLUMNS = [
  { id: 'name',     label: 'Name'        },
  { id: 'role',     label: 'Role Summary' },
  { id: 'dept',     label: 'Department'  },
  { id: 'status',   label: 'Status'      },
  { id: 'location', label: 'Location'    },
]

const CC_ROWS: Row[] = [
  { id: 'cc1',  cells: ['Alice Johnson',    'Leads the frontend architecture team and is responsible for establishing coding standards across all product surfaces.',              'Engineering',      'Active',   'San Francisco'] },
  { id: 'cc2',  cells: ['Bob Martinez',     'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.',                               'Platform',         'Remote',   'Berlin']        },
  { id: 'cc3',  cells: ['Carol White',      'Manages the design system and ensures visual consistency from the component library down to individual page layouts.',              'Design',           'Active',   'London']        },
  { id: 'cc4',  cells: ['David Kim',        'Full-stack engineer who primarily owns the billing and subscription management subsystem.',                                         'Engineering',      'Active',   'Seoul']         },
  { id: 'cc5',  cells: ['Eva Schulz',       'Data analyst responsible for building dashboards, defining metrics, and running A/B test analyses.',                               'Analytics',        'Remote',   'Amsterdam']     },
  { id: 'cc6',  cells: ['Frank Okafor',     'DevOps engineer overseeing CI/CD pipelines, container orchestration, and cloud cost optimisation strategies.',                     'Infrastructure',   'Remote',   'Lagos']         },
  { id: 'cc7',  cells: ['Grace Tanaka',     'Product manager for the core editor experience, gathering user feedback and shaping the feature roadmap for the next two quarters.','Product',          'Active',   'Tokyo']         },
  { id: 'cc8',  cells: ['Hiro Nakamura',    'Security engineer who performs threat modelling and conducts regular penetration tests on all customer-facing services.',           'Security',         'On Leave', 'Osaka']         },
  { id: 'cc9',  cells: ['Isabel Costa',     'Customer success manager who works closely with enterprise clients to ensure smooth onboarding and long-term retention.',           'Customer Success',  'Active',  'Lisbon']        },
  { id: 'cc10', cells: ['James Li',         'Mobile engineer building the iOS and Android apps; also maintains the React Native component library shared across platforms.',     'Mobile',           'Contract', 'New York']      },
  { id: 'cc11', cells: ['Karen Patel',      'Technical writer who owns all public API documentation, internal runbooks, and the developer-facing changelog.',                   'Documentation',    'Remote',   'Mumbai']        },
  { id: 'cc12', cells: ['Luis Fernandez',   'QA lead responsible for test strategy, automation frameworks, and coordinating release sign-off across teams.',                    'Quality Assurance', 'Active',  'Buenos Aires']  },
]

const CC_ID_TO_INDEX: Record<string, number> = Object.fromEntries(
  CC_COLUMNS.map((col, i) => [col.id, i]),
)

function renderCCCell(value: string, _rowIndex: number, colIndex: number): React.ReactNode {
  if (colIndex === 2) {
    const colors = DEPT_COLORS[value]
    if (colors) {
      return <span className="demo-dept-badge" style={{ color: colors.text, background: colors.bg }}>{value}</span>
    }
  }
  if (colIndex === 3) {
    const colors = STATUS_COLORS[value]
    if (colors) {
      return <span className="demo-dept-badge" style={{ color: colors.text, background: colors.bg }}>{value}</span>
    }
  }
  return value
}

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
            <div className="demo-stat-value">7</div>
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
          <span className="demo-section-eyebrow">Measurement · zero DOM reads</span>
          <h2 className="demo-section-title">useMeasure</h2>
          <p className="demo-section-desc">
            Computes row heights from text before the browser renders. Calls{' '}
            <code className="demo-code">prepare()</code> once per dataset, then{' '}
            <code className="demo-code">layout()</code> — pure arithmetic — on every
            column-width change. No <code className="demo-code">getBoundingClientRect</code>,
            no reflows.
          </p>

          <div className="demo-split">
            <div className="demo-split__table">
              <div className="demo-table-meta">
                <span className="demo-pill">Name · 200px</span>
                <span className="demo-pill">Role Summary · 300px</span>
                <span className="demo-pill">Department · 220px</span>
              </div>
              <div className="demo-table-wrapper demo-table-wrapper--fit">
                <BasicTable rows={ROWS} columnWidths={COLUMN_WIDTHS} renderCell={renderDeptCell} />
              </div>
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useMeasure"
                code={`const rowHeights = useMeasure(
  rows,
  columnWidths,
  { lineHeight: 20, cellPadding: 16 }
)

// Apply to each <tr>:
<tr style={{ height: rowHeights[i] }}>
  ...
</tr>`}
              />
            </div>
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Expandable · container resize</span>
          <h2 className="demo-section-title">useExpandable</h2>
          <p className="demo-section-desc">
            Wraps <code className="demo-code">ResizeObserver</code> and fires{' '}
            <code className="demo-code">onResize(w, h, prevW, prevH)</code> when the
            container changes size. Combine with{' '}
            <code className="demo-code">useMeasure</code> to scale column widths
            proportionally and recompute row heights — no DOM reads.
            Drag the right edge of the table to try it.
          </p>
          <div className="demo-split">
            <div className="demo-split__table">
              <div className="demo-table-wrapper">
                <ExpandableTable
                  rows={ROWS}
                  headers={EXPANDABLE_HEADERS}
                  defaultColumnWidths={EXPANDABLE_DEFAULT_WIDTHS}
                  renderCell={renderDeptCell}
                />
              </div>
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useExpandable"
                code={`const containerRef = useExpandable({
  onResize(w, _h, prev) {
    setColumnWidths(cols =>
      cols.map(c =>
        Math.max(c * (w / prev), 60)
      )
    )
  },
})

<div ref={containerRef}>
  ...
</div>`}
              />
            </div>
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Resizable · drag handles</span>
          <h2 className="demo-section-title">useResizable</h2>
          <p className="demo-section-desc">
            Manages column-width and row-height drag state. Returns{' '}
            <code className="demo-code">getColHandleProps</code> and{' '}
            <code className="demo-code">getRowHandleProps</code> for attach-anywhere
            drag handles. Drag a column edge to resize it. Drag the bottom of a row
            to override its height.{' '}
            <strong>Double-click a column handle</strong> to auto-fit via{' '}
            <code className="demo-code">useShrinkWrap</code>.
          </p>
          <div className="demo-split">
            <div className="demo-split__table">
              <div className="demo-table-wrapper">
                <ResizableTable
                  rows={ROWS}
                  headers={RESIZABLE_HEADERS}
                  defaultColumnWidths={RESIZABLE_DEFAULT_WIDTHS}
                  horizontal
                  vertical
                  shrinkWrap
                  renderCell={renderDeptCell}
                />
              </div>
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useResizable"
                code={`const {
  columnWidths,
  getColHandleProps,
  getRowHandleProps,
} = useResizable({
  defaultColumnWidths: [160, 280, 160],
  horizontal: true,
  vertical: true,
})

// Attach to a column resize handle:
<span {...getColHandleProps(colIndex)} />`}
              />
            </div>
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Ghost preview · column drag</span>
          <h2 className="demo-section-title">useResizePreview</h2>
          <p className="demo-section-desc">
            While a column drag is in-flight, computes per-row preview heights via{' '}
            <code className="demo-code">layout()</code> at ~0.09 ms/row — no DOM
            reads. Returns <code className="demo-code">previewHeights[]</code> that
            render as a ghost layer. Real heights commit only on drag end. Drag a
            column handle below to see it.
          </p>
          <div className="demo-split">
            <div className="demo-split__table">
              <ResizePreviewDemo />
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useResizePreview"
                code={`const { previewHeights } = useResizePreview(
  prepared,       // from prepareWithSegments()
  previewDragState, // from useResizable
  { columnWidths, lineHeight: 20 }
)

// previewHeights is null when not dragging.
// Use it for a ghost layer beside the table.`}
              />
            </div>
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Virtualization · windowed render</span>
          <h2 className="demo-section-title">useVirtualization</h2>
          <p className="demo-section-desc">
            Given <code className="demo-code">rowHeights[]</code> from{' '}
            <code className="demo-code">useMeasure</code>, computes the visible
            window with binary search — no DOM reads, no{' '}
            <code className="demo-code">ResizeObserver</code>. Because heights are
            exact from the first frame, the scrollbar is correctly sized immediately.
            500 rows below.
          </p>
          <div className="demo-split">
            <div className="demo-split__table">
              <div className="demo-table-meta">
                <span className="demo-pill">Name · 180px</span>
                <span className="demo-pill">Role Summary · 340px</span>
                <span className="demo-pill">Department · 160px</span>
              </div>
              <div className="demo-table-wrapper">
                <VirtualizedTable
                  rows={VIRTUAL_ROWS}
                  columnWidths={VIRTUAL_COLUMN_WIDTHS}
                  height={360}
                  renderCell={renderDeptCell}
                />
              </div>
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useVirtualization"
                code={`const { startIndex, endIndex,
        totalHeight, offsets } =
  useVirtualization({
    rowHeights,   // from useMeasure
    scrollTop,
    viewportHeight: 360,
    overscan: 3,
  })

// Inner spacer sets total scroll height:
<div style={{ height: totalHeight }}>
  {rows.slice(startIndex, endIndex + 1)
    .map((row, i) => (
      <div style={{
        position: 'absolute',
        top: offsets[startIndex + i],
      }}>
        ...
      </div>
    ))}
</div>`}
              />
            </div>
          </div>
        </section>

        <section className="demo-section">
          <span className="demo-section-eyebrow">Visibility · Sorting · Sticky column</span>
          <h2 className="demo-section-title">useColumnControls + useStickyColumns</h2>
          <p className="demo-section-desc">
            <code className="demo-code">useColumnControls</code> manages column
            visibility and sort state — hidden columns are removed from layout and
            measurement entirely.{' '}
            <code className="demo-code">useStickyColumns</code> slices the visible
            widths into frozen and scrollable panes so the first column stays pinned
            via <code className="demo-code">position: sticky</code>. A single{' '}
            <code className="demo-code">useMeasure</code> call uses all widths to keep
            row heights consistent across panes. Toggle columns with the checkboxes;
            click any header to sort.
          </p>
          <div className="demo-split">
            <div className="demo-split__table">
              <div className="demo-table-meta">
                <span className="demo-pill">Name · 190px</span>
                <span className="demo-pill">Role Summary · 300px</span>
                <span className="demo-pill">Department · 160px</span>
                <span className="demo-pill">Status · 120px</span>
                <span className="demo-pill">Location · 160px</span>
              </div>
              <div className="demo-table-wrapper">
                <StickyColumnShowcase />
              </div>
            </div>
            <div className="demo-split__code">
              <CodeSnippet
                label="useColumnControls + useStickyColumns"
                code={`const { visibleColumns, allColumns,
        toggleColumnVisibility,
        sortKey, sortDirection,
        setSort } =
  useColumnControls(columns)

const visibleWidths = visibleColumns
  .map(col => columnWidths[idToIndex[col.id]])

// AC01: frozenWidths/scrollWidths drive
//       the frozen and scrollable panes
const { frozenWidths, scrollWidths } =
  useStickyColumns({
    frozenCount: 1,
    columnWidths: visibleWidths,
  })

// AC03: single useMeasure — all widths
const { rowHeights } = useMeasure(
  visibleRows,
  frozenWidths.concat(scrollWidths),
)`}
              />
            </div>
          </div>
        </section>

        <DraggableDemo />

        <ShrinkWrapDemo />

        <ScrollAnchorDemo />

        <InfiniteScrollDemo />

        <DetachableDemo />

        <CanvasCellDemo />
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StickyColumnShowcase — wires useStickyColumns into the visibility/sort demo
// ---------------------------------------------------------------------------

function StickyColumnShowcase() {
  const {
    visibleColumns,
    allColumns,
    sortKey,
    sortDirection,
    toggleColumnVisibility,
    setSort,
  } = useColumnControls(CC_COLUMNS)

  const visibleIndices = useMemo(
    () => visibleColumns.map((col) => CC_ID_TO_INDEX[col.id]!),
    [visibleColumns],
  )

  const visibleWidths = useMemo(
    () => visibleIndices.map((i) => CC_COLUMN_WIDTHS[i]!),
    [visibleIndices],
  )

  // AC01: useStickyColumns drives the frozen / scrollable split
  const { frozenWidths, scrollWidths } = useStickyColumns({
    frozenCount: 1,
    columnWidths: visibleWidths,
  })

  const sortColIndex = sortKey !== null ? (CC_ID_TO_INDEX[sortKey] ?? null) : null

  const sortedRows = useMemo<Row[]>(() => {
    if (sortColIndex === null || sortDirection === null) return CC_ROWS
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...CC_ROWS].sort(
      (a, b) =>
        dir * (a.cells[sortColIndex] ?? '').localeCompare(b.cells[sortColIndex] ?? ''),
    )
  }, [sortColIndex, sortDirection])

  const visibleRows = useMemo<Row[]>(
    () =>
      sortedRows.map((row) => ({
        id: row.id,
        cells: visibleIndices.map((i) => row.cells[i]!),
      })),
    [sortedRows, visibleIndices],
  )

  // AC03: single useMeasure call — all widths (frozen + scrollable)
  const { rowHeights } = useMeasure(visibleRows, frozenWidths.concat(scrollWidths))

  // Columns for each pane, derived from useStickyColumns output (AC04)
  const frozenCols = visibleColumns.slice(0, frozenWidths.length)
  const scrollCols = visibleColumns.slice(frozenWidths.length)

  return (
    <div className="cc-wrapper">
      <div className="cc-visibility-controls" role="group" aria-label="Column visibility">
        {allColumns.map((col) => {
          const isLast = visibleColumns.length === 1 && col.visible
          return (
            <label
              key={col.id}
              className={`cc-visibility-toggle${col.visible ? ' cc-visibility-toggle--active' : ''}${isLast ? ' cc-visibility-toggle--disabled' : ''}`}
            >
              <input
                type="checkbox"
                checked={col.visible}
                disabled={isLast}
                onChange={() => toggleColumnVisibility(col.id)}
              />
              {col.label}
            </label>
          )
        })}
      </div>

      {/* AC02: overflow-x:auto scroll container; frozen cells use position:sticky left:0 */}
      <div className="cc-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
        <table
          className="cc-table"
          style={{ '--cc-table-font': BODY_FONT } as React.CSSProperties}
        >
          <thead>
            <tr>
              {frozenCols.map((col, fi) => {
                const isSorted = sortKey === col.id
                const leftOffset = frozenWidths.slice(0, fi).reduce((s, w) => s + w, 0)
                return (
                  <th
                    key={col.id}
                    style={{
                      width: frozenWidths[fi],
                      maxWidth: frozenWidths[fi],
                      font: HEADER_FONT,
                      position: 'sticky',
                      left: leftOffset,
                    }}
                    onClick={() => setSort(col.id)}
                  >
                    {col.label}
                    {isSorted && sortDirection !== null && (
                      <span className="cc-table-sort-indicator">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                )
              })}
              {scrollCols.map((col, si) => {
                const isSorted = sortKey === col.id
                return (
                  <th
                    key={col.id}
                    style={{
                      width: scrollWidths[si],
                      maxWidth: scrollWidths[si],
                      font: HEADER_FONT,
                    }}
                    onClick={() => setSort(col.id)}
                  >
                    {col.label}
                    {isSorted && sortDirection !== null && (
                      <span className="cc-table-sort-indicator">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
                {frozenCols.map((col, fi) => {
                  const colIndex = CC_ID_TO_INDEX[col.id]!
                  const leftOffset = frozenWidths.slice(0, fi).reduce((s, w) => s + w, 0)
                  return (
                    <td
                      key={col.id}
                      style={{
                        width: frozenWidths[fi],
                        maxWidth: frozenWidths[fi],
                        position: 'sticky',
                        left: leftOffset,
                      }}
                    >
                      {renderCCCell(row.cells[colIndex]!, rowIndex, colIndex)}
                    </td>
                  )
                })}
                {scrollCols.map((col, si) => {
                  const colIndex = CC_ID_TO_INDEX[col.id]!
                  return (
                    <td
                      key={col.id}
                      style={{
                        width: scrollWidths[si],
                        maxWidth: scrollWidths[si],
                      }}
                    >
                      {renderCCCell(row.cells[colIndex]!, rowIndex, colIndex)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

// ---------------------------------------------------------------------------
// ResizePreviewDemo
// ---------------------------------------------------------------------------

const RP_DEFAULT_WIDTHS = [180, 320, 160]
const RP_LINE_HEIGHT = 20
const RP_CELL_PADDING = 16
const RP_HEADERS = ['Name', 'Role Summary', 'Department']
const RP_MIN_COL = 60
const RP_ROWS = ROWS.slice(0, 4)

function ResizePreviewDemo() {
  const { columnWidths, getColHandleProps, previewDragState } =
    useResizable({
      defaultColumnWidths: RP_DEFAULT_WIDTHS,
      minColumnWidth: RP_MIN_COL,
      horizontal: true,
      rowCount: RP_ROWS.length,
    })

  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)) }, [])

  const prepared = useMemo(() => {
    if (!fontsReady) return null
    return RP_ROWS.map((row) => row.cells.map((cell) => prepareWithSegments(cell, BODY_FONT)))
  }, [fontsReady])

  const { rowHeights } = useMeasure(RP_ROWS, columnWidths, { lineHeight: RP_LINE_HEIGHT, cellPadding: RP_CELL_PADDING })
  const { previewHeights } = useResizePreview(prepared, previewDragState, {
    columnWidths,
    lineHeight: RP_LINE_HEIGHT,
    cellPadding: RP_CELL_PADDING,
  })

  const isDragging = previewDragState !== null

  return (
    <div className="rp-layout">
      {/* Actual table */}
      <div className="rp-layout__main">
        <div className="demo-table-meta">
          {RP_HEADERS.map((h, i) => (
            <span key={i} className="demo-pill">{h} · {Math.round(columnWidths[i]!)}px</span>
          ))}
        </div>
        <div className="demo-table-wrapper">
          <table
            className="rp-table"
            style={{ width: columnWidths.reduce((a, b) => a + b, 0) }}
          >
            <thead>
              <tr>
                {RP_HEADERS.map((h, colIndex) => (
                  <th
                    key={colIndex}
                    style={{ width: columnWidths[colIndex] }}
                  >
                    {h}
                    {colIndex < RP_HEADERS.length - 1 && (
                      <span
                        {...getColHandleProps(colIndex)}
                        className={`rp-col-handle${isDragging && previewDragState?.colIndex === colIndex ? ' rp-col-handle--active' : ''}`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RP_ROWS.map((row, rowIndex) => (
                <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
                  {row.cells.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      style={{ width: columnWidths[colIndex] }}
                    >
                      {renderDeptCell(cell, rowIndex, colIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ghost preview panel */}
      <div className="rp-layout__preview">
        <div className={`rp-preview-label${isDragging ? ' rp-preview-label--active' : ''}`}>
          {isDragging
            ? `Preview · col ${(previewDragState?.colIndex ?? 0) + 1} → ${Math.round(previewDragState?.currentWidth ?? 0)}px`
            : 'Drag a handle →'}
        </div>
        <div className="rp-preview-rows">
          {rowHeights.map((committed, i) => {
            const preview = previewHeights?.[i] ?? null
            return (
              <div
                key={i}
                className="rp-preview-row"
                style={{ height: Math.max(committed, preview ?? 0) }}
              >
                {/* committed height bar */}
                <div className="rp-bar rp-bar--committed" style={{ height: committed }} />
                {/* preview height bar */}
                {preview !== null && (
                  <div
                    className={`rp-bar ${preview > committed ? 'rp-bar--grow' : 'rp-bar--shrink'}`}
                    style={{ height: preview }}
                  />
                )}
                <span className="rp-row-label">
                  {preview !== null
                    ? `${committed}→${preview}px`
                    : `${committed}px`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DraggableDemo() {
  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Drag-to-reorder · rows + columns</span>
      <h2 className="demo-section-title">useDraggable</h2>
      <p className="demo-section-desc">
        Manages row and column reorder drag state using native browser
        drag-and-drop. Returns{' '}
        <code className="demo-code">getRowHandleProps</code> and{' '}
        <code className="demo-code">getColHandleProps</code> for grip
        elements. Row heights stay correct through every reorder because{' '}
        <code className="demo-code">prepare()</code> is keyed to the original
        data, not the display order.
      </p>
      <div className="demo-split">
        <div className="demo-split__table">
          <div className="demo-table-wrapper">
            <DraggableTable
              rows={DRAGGABLE_ROWS}
              headers={DRAGGABLE_HEADERS}
              columnWidths={DRAGGABLE_COLUMN_WIDTHS}
              renderCell={renderDeptCell}
            />
          </div>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useDraggable"
            code={`const { rowOrder, columnOrder,
        getRowHandleProps,
        getColHandleProps } =
  useDraggable({
    rowCount: rows.length,
    columnCount: cols.length,
    onRowsReorder,
    onColumnsReorder,
  })

// Render rows in visual order:
rowOrder.map(dataIndex => rows[dataIndex])`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ShrinkWrapDemo — shows useShrinkWrap with "Fit column" buttons
// ---------------------------------------------------------------------------

// Layer 3 custom composition: this component manages its own prepare phase so
// the prepared grid can be shared with both useMeasure (row heights) and
// useShrinkWrap (fitColumn).  In a real integration the prepare memo would
// live in a shared hook; here it is inlined for clarity.

const SW_ROWS: Row[] = [
  { id: 'sw1', cells: ['Alice Johnson', 'Leads the frontend architecture team and establishes coding standards across all product surfaces.', 'Engineering'] },
  { id: 'sw2', cells: ['Bob Martinez', 'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.', 'Platform'] },
  { id: 'sw3', cells: ['Carol White', 'Manages the design system and ensures visual consistency from the component library down to individual page layouts.', 'Design'] },
  { id: 'sw4', cells: ['David Kim', 'Full-stack engineer who primarily owns the billing and subscription management subsystem.', 'Engineering'] },
  { id: 'sw5', cells: ['Eva Schulz', 'Data analyst responsible for building dashboards, defining metrics, and running A/B test analyses.', 'Analytics'] },
]

const SW_HEADERS = ['Name', 'Role Summary', 'Department']
const SW_DEFAULT_WIDTHS = [280, 480, 240]

function ShrinkWrapDemo() {
  const [columnWidths, setColumnWidths] = useState<number[]>(SW_DEFAULT_WIDTHS)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // prepare() once per (rows, font) change — shared between layout and shrink-wrap.
  // Header cells are measured with HEADER_FONT so fit accounts for column labels too.
  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    const headerRow = SW_HEADERS.map((h) => prepareWithSegments(h, HEADER_FONT))
    const dataRows = SW_ROWS.map((row) => row.cells.map((cell) => prepareWithSegments(cell, BODY_FONT)))
    return [headerRow, ...dataRows]
  }, [fontsReady])

  const { rowHeights } = useMeasure(SW_ROWS, columnWidths, { font: BODY_FONT })
  const { fitColumn } = useShrinkWrap(prepared, columnWidths)

  function handleFit(colIndex: number) {
    const w = fitColumn(colIndex)
    setColumnWidths((prev) => prev.map((v, i) => (i === colIndex ? w : v)))
  }

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Shrink-wrap · Double-click to fit</span>
      <h2 className="demo-section-title">useShrinkWrap</h2>
      <p className="demo-section-desc">
        Binary-searches for the minimum column width where no cell text wraps,
        using <code className="demo-code">walkLineRanges()</code> — zero DOM
        calls. Double-click a column handle below to snap it to its tightest
        fit. Something <code className="demo-code">getBoundingClientRect</code>
        -based libraries can only approximate; here it is exact.
      </p>

      <div className="demo-split">
        <div className="demo-split__table">
          <div className="demo-shrinkwrap-controls">
            <button
              className="demo-fit-btn demo-fit-btn--reset"
              onClick={() => setColumnWidths(SW_DEFAULT_WIDTHS)}
            >
              Reset widths
            </button>
          </div>
          <div className="demo-table-meta">
            {SW_HEADERS.map((h, i) => (
              <span key={i} className="demo-pill">
                {h} · {Math.round(columnWidths[i]!)}px
              </span>
            ))}
          </div>
          <div className="demo-table-wrapper">
            <table
              className="demo-sw-table"
            >
              <thead>
                <tr>
                  {SW_HEADERS.map((h, i) => (
                    <th key={i} style={{ width: columnWidths[i], position: 'relative' }}>
                      <span className="demo-sw-header-text">{h}</span>
                      {i < SW_HEADERS.length - 1 && (
                        <span
                          className="demo-col-fit-handle"
                          onDoubleClick={() => handleFit(i)}
                          title="Double-click to auto-fit this column"
                          role="separator"
                          tabIndex={0}
                          aria-label={`Auto-fit ${h} column`}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SW_ROWS.map((row, ri) => (
                  <tr key={row.id} style={{ height: rowHeights[ri] }}>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} style={{ width: columnWidths[ci] }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useShrinkWrap"
            code={`const { fitColumn } =
  useShrinkWrap(prepared, columnWidths)

// On double-click of a column handle:
function handleFit(colIndex: number) {
  const w = fitColumn(colIndex)
  setColumnWidths(prev =>
    prev.map((v, i) =>
      i === colIndex ? w : v
    )
  )
}

// Uses walkLineRanges() + binary search.
// Zero DOM reads.`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ScrollAnchorDemo — useScrollAnchor: prepend without scroll jump
// ---------------------------------------------------------------------------

const SA_COLUMN_WIDTHS = [80, 120, 480]
const SA_HEADERS = ['Time', 'Author', 'Message']

const SA_AUTHORS = ['Alice', 'Bob', 'Carol', 'David', 'Eva']
const SA_MESSAGES = [
  'Just deployed the new auth service to staging — let me know if you hit any issues.',
  'Looks good to me. The latency numbers are better than last week.',
  'I found a small bug in the token refresh path. Opening a PR now.',
  'Can someone review the migration script before we run it in prod?',
  'Done. Left a couple of comments about the rollback plan.',
  'Updated the runbook with the new service endpoints.',
  'Heads up: the canary is at 5 % traffic. Watching error rates.',
  'Error rate is flat. Bumping to 25 %.',
  'All metrics nominal at 25 %. Will go to 100 % at EOD.',
  'Deployment complete. Closing the incident channel.',
]

let _saCounter = 0
function makeSaRow(offsetMin = 0): Row {
  const idx = _saCounter++
  const d = new Date(Date.now() - offsetMin * 60_000)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return {
    id: `sa-${idx}`,
    cells: [
      `${hh}:${mm}`,
      SA_AUTHORS[idx % SA_AUTHORS.length]!,
      SA_MESSAGES[idx % SA_MESSAGES.length]!,
    ],
  }
}

const SA_INITIAL_ROWS: Row[] = Array.from({ length: 12 }, (_, i) =>
  makeSaRow((11 - i) * 3),
)

function ScrollAnchorDemo() {
  const [rows, setRows] = useState<Row[]>(SA_INITIAL_ROWS)
  const [isLive, setIsLive] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { rowHeights } = useMeasure(rows, SA_COLUMN_WIDTHS)
  const { prepend } = useScrollAnchor(rowHeights, scrollRef)

  // Scroll to bottom on first render so the user sees the latest messages.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  function handlePrepend() {
    const newRows: Row[] = Array.from({ length: 3 }, (_, i) =>
      makeSaRow((rows.length + 3 - i) * 3),
    )
    prepend(newRows)
    setRows((prev) => [...newRows, ...prev])
  }

  // Live feed simulation: auto-prepend one new message every 2 s.
  useEffect(() => {
    if (!isLive) return
    const id = setInterval(() => {
      const newRow = makeSaRow(0)
      prepend([newRow])
      setRows((prev) => [newRow, ...prev])
    }, 2000)
    return () => clearInterval(id)
  }, [isLive, prepend])

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Scroll anchor · prepend / live feed</span>
      <h2 className="demo-section-title">useScrollAnchor</h2>
      <p className="demo-section-desc">
        When rows are prepended, computes the exact{' '}
        <code className="demo-code">scrollTop</code> correction from pretext
        offsets before the DOM updates — keeping the visible content stable.
        No <code className="demo-code">getBoundingClientRect</code>, no{' '}
        <code className="demo-code">scrollHeight</code> reads. Click{' '}
        <em>Load older messages</em> or toggle the live feed below.
      </p>
      <div className="demo-split">
        <div className="demo-split__table">
          <div className="demo-shrinkwrap-controls">
            <button className="demo-fit-btn" onClick={handlePrepend}>
              ↑ Load older messages
            </button>
            <button
              className={`demo-fit-btn${isLive ? ' demo-fit-btn--live-active' : ''}`}
              onClick={() => setIsLive((v) => !v)}
            >
              {isLive ? '⏸ Stop live feed' : '▶ Start live feed'}
            </button>
          </div>
          <div
            ref={scrollRef}
            className="sa-scroll-container"
          >
            <table
              className="demo-sw-table"
            >
              <thead>
                <tr>
                  {SA_HEADERS.map((h, i) => (
                    <th key={i} style={{ width: SA_COLUMN_WIDTHS[i] }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.id} style={{ height: rowHeights[ri] }}>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} style={{ width: SA_COLUMN_WIDTHS[ci] }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useScrollAnchor"
            code={`const { prepend } =
  useScrollAnchor(rowHeights, scrollRef)

// Prepend rows without scroll jump:
function handlePrepend() {
  prepend(newRows)
  setRows(prev => [...newRows, ...prev])
}

// scrollTop is corrected atomically
// using pretext offsets — before paint.`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// InfiniteScrollDemo — useInfiniteScroll: append rows on scroll-to-bottom
// ---------------------------------------------------------------------------

const IS_COLUMN_WIDTHS = [160, 300, 140]
const IS_HEADERS = ['Name', 'Role Summary', 'Department']

const IS_NAMES = [
  'Frank Okafor', 'Grace Tanaka', 'Hiro Nakamura', 'Isabel Costa', 'James Li',
  'Karen Patel', 'Luis Fernandez', 'Maria Singh', 'Nathan Brooks', 'Olivia Chen',
]
const IS_ROLES = [
  'DevOps engineer overseeing CI/CD pipelines, container orchestration, and cloud cost optimisation.',
  'Product manager shaping the feature roadmap and gathering user feedback each quarter.',
  'Security engineer who performs threat modelling and regular penetration tests on all services.',
  'Customer success manager working with enterprise clients to ensure smooth onboarding.',
  'Mobile engineer building the iOS and Android apps with a shared React Native component library.',
  'Technical writer owning all public API documentation, runbooks, and the developer changelog.',
  'QA lead responsible for test strategy, automation frameworks, and release sign-off coordination.',
  'Data scientist building predictive models and reporting pipelines for the analytics platform.',
  'Backend engineer designing high-throughput message queues and event-driven microservices.',
  'Frontend engineer focused on accessibility, performance, and cross-browser compatibility.',
]
const IS_DEPTS = [
  'Infrastructure', 'Product', 'Security', 'Customer Success', 'Mobile',
  'Documentation', 'Quality Assurance', 'Data Science', 'Platform', 'Engineering',
]

let _isCounter = 0

function makeIsRow(): Row {
  const i = _isCounter % IS_NAMES.length
  return {
    id: `is-${_isCounter++}`,
    cells: [IS_NAMES[i]!, IS_ROLES[i]!, IS_DEPTS[i]!],
  }
}

const IS_INITIAL_ROWS: Row[] = Array.from({ length: 8 }, () => makeIsRow())

function InfiniteScrollDemo() {
  const [rows, setRows] = useState<Row[]>(IS_INITIAL_ROWS)
  const { rowHeights } = useMeasure(rows, IS_COLUMN_WIDTHS)

  const onLoadMore = useCallback(async (): Promise<Row[]> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 700))
    const batch = Array.from({ length: 6 }, () => makeIsRow())
    setRows((prev) => [...prev, ...batch])
    return batch
  }, [])

  const { onScroll, isLoading } = useInfiniteScroll({
    onLoadMore,
    threshold: 120,
    rowHeights,
  })

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Infinite scroll · append on demand</span>
      <h2 className="demo-section-title">useInfiniteScroll</h2>
      <p className="demo-section-desc">
        Triggers <code className="demo-code">onLoadMore</code> when the user
        scrolls within <code className="demo-code">threshold</code> px of the
        bottom. Total content height is derived from pretext{' '}
        <code className="demo-code">rowHeights</code> — not{' '}
        <code className="demo-code">scrollHeight</code>. Guards against
        concurrent loads with an in-flight ref. Scroll to the bottom of the
        table below to load more rows.
      </p>
      <div className="demo-split">
        <div className="demo-split__table">
          <div
            className="is-scroll-container"
            onScroll={onScroll}
          >
            <table
              className="demo-sw-table"
              style={{ tableLayout: 'fixed', width: IS_COLUMN_WIDTHS.reduce((a, b) => a + b, 0) }}
            >
              <thead>
                <tr>
                  {IS_HEADERS.map((h, i) => (
                    <th key={i} style={{ width: IS_COLUMN_WIDTHS[i], font: HEADER_FONT }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.id} style={{ height: rowHeights[ri] }}>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} style={{ width: IS_COLUMN_WIDTHS[ci] }}>
                        {renderDeptCell(cell, ri, ci)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoading && (
              <div className="is-loading-indicator" aria-live="polite" aria-busy="true">
                <span className="is-loading-spinner" aria-hidden="true" />
                Loading more rows…
              </div>
            )}
          </div>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useInfiniteScroll"
            code={`const { onScroll, isLoading } =
  useInfiniteScroll({
    onLoadMore,   // () => Promise<Row[]>
    threshold: 120,
    rowHeights,   // from useMeasure
  })

// Attach to the scroll container:
<div onScroll={onScroll}>
  ...rows...
  {isLoading && <Spinner />}
</div>

// Total height = rowHeights sum,
// not DOM scrollHeight.`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// DetachableDemo — useDetachable: expand rows into inline child tables
// ---------------------------------------------------------------------------

// Parent rows: teams with a short description and a project count
const DT_PARENT_ROWS: Row[] = [
  { id: 'dt-team-1', cells: ['Frontend', 'Owns the component library, design system, and all customer-facing web surfaces. Works closely with Design to ship pixel-perfect interfaces.', '4 projects'] },
  { id: 'dt-team-2', cells: ['Platform',  'Responsible for core API infrastructure, authentication services, and the internal developer platform that all product teams rely on.',             '3 projects'] },
  { id: 'dt-team-3', cells: ['Data',       'Builds the analytics pipeline, event ingestion, and all reporting dashboards consumed by business stakeholders and product managers.',       '5 projects'] },
]

const DT_PARENT_COL_WIDTHS = [140, 360, 120]

// Child rows per parent: individual project entries
const DT_CHILD_ROWS: Record<string, Row[]> = {
  'dt-team-1': [
    { id: 'dt-p-1a', cells: ['Design System v3',        'Migrate all components to the new token architecture and add dark-mode support across the full component set.',     'In Progress'] },
    { id: 'dt-p-1b', cells: ['Accessibility Audit',     'Full WCAG 2.2 AA compliance pass covering keyboard navigation, colour contrast, and screen-reader annotations.',   'Planned']     },
    { id: 'dt-p-1c', cells: ['Performance Dashboard',   'Surface Core Web Vitals per page, track regressions in CI, and expose a public status page for stakeholders.',      'In Progress'] },
    { id: 'dt-p-1d', cells: ['Component Playground',    'Interactive Storybook environment with live prop controls, automatically published on every main-branch merge.',      'Shipped']     },
  ],
  'dt-team-2': [
    { id: 'dt-p-2a', cells: ['Auth Service Rewrite',    'Replace the legacy session-cookie auth with short-lived JWTs and refresh-token rotation to improve security posture.', 'In Progress'] },
    { id: 'dt-p-2b', cells: ['Internal Dev Portal',     'Self-service portal for spinning up staging environments, viewing service health, and triggering manual deploys.',    'Planned']     },
    { id: 'dt-p-2c', cells: ['API Rate Limiting',       'Implement per-tenant rate limiting with configurable tiers; surface quota usage in the developer dashboard.',         'Shipped']     },
  ],
  'dt-team-3': [
    { id: 'dt-p-3a', cells: ['Event Pipeline v2',       'Rewrite the ingestion layer with Kafka to support 10× throughput while reducing end-to-end latency to under 200 ms.', 'In Progress'] },
    { id: 'dt-p-3b', cells: ['Revenue Dashboard',       'Real-time MRR, churn, and LTV charts with cohort breakdown; built on top of the new query engine.',                   'Shipped']     },
    { id: 'dt-p-3c', cells: ['Experiment Framework',    'A/B testing infrastructure that integrates with feature flags to track metric impact per variant automatically.',     'In Progress'] },
    { id: 'dt-p-3d', cells: ['Data Quality Monitor',    'Automated schema validation, anomaly detection, and Slack alerting so bad data never silently corrupts reports.',     'Planned']     },
    { id: 'dt-p-3e', cells: ['ML Feature Store',        'Centralised registry for training features; versioned snapshots, lineage tracking, and an online serving API.',       'Planned']     },
  ],
}

const DT_CHILD_COL_WIDTHS = [200, 370, 100]
const DT_CHILD_HEADERS = ['Project', 'Description', 'Status']

const DT_STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  'In Progress': { text: 'oklch(72% 0.12 200)', bg: 'oklch(16% 0.04 200)' },
  'Planned':     { text: 'oklch(68% 0.08 280)', bg: 'oklch(16% 0.03 280)' },
  'Shipped':     { text: 'oklch(72% 0.12 145)', bg: 'oklch(16% 0.04 145)' },
}

/** Inline child table — owns its own independent useMeasure instance. */
function DetachableChildPanel({ rows }: { rows: Row[] }) {
  // Independent useMeasure — no shared or recursive measurement with the parent.
  const { rowHeights } = useMeasure(rows, DT_CHILD_COL_WIDTHS, {
    lineHeight: 20,
    cellPadding: 16,
  })
  return (
    <div className="dt-child-panel">
      <table className="dt-child-table" style={{ '--dt-child-font': BODY_FONT } as React.CSSProperties}>
        <thead>
          <tr>
            {DT_CHILD_HEADERS.map((h) => (
              <th key={h} style={{ width: DT_CHILD_COL_WIDTHS[DT_CHILD_HEADERS.indexOf(h)] }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.id} style={{ height: rowHeights[ri] }}>
              {row.cells.map((cell, ci) => {
                if (ci === 2) {
                  const colors = DT_STATUS_COLORS[cell]
                  return (
                    <td key={ci} style={{ width: DT_CHILD_COL_WIDTHS[ci] }}>
                      {colors
                        ? <span className="demo-dept-badge" style={{ color: colors.text, background: colors.bg }}>{cell}</span>
                        : cell}
                    </td>
                  )
                }
                return <td key={ci} style={{ width: DT_CHILD_COL_WIDTHS[ci] }}>{cell}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DetachableDemo() {
  const { expandedRows, toggle, getChildRows } = useDetachable({
    getChildRows: (row) => DT_CHILD_ROWS[row.id] ?? [],
  })

  // Independent parent useMeasure instance.
  const { rowHeights } = useMeasure(DT_PARENT_ROWS, DT_PARENT_COL_WIDTHS, {
    lineHeight: 20,
    cellPadding: 16,
  })

  const DT_PARENT_HEADERS = ['Team', 'Mission', 'Projects']

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Nested data · expand inline child table</span>
      <h2 className="demo-section-title">useDetachable</h2>
      <p className="demo-section-desc">
        Clicking a row expands an inline child table below it. Each child table
        runs its own independent{' '}
        <code className="demo-code">useMeasure</code> instance — no shared or
        recursive measurement. Cells stay typed as{' '}
        <code className="demo-code">string[]</code>; child data is supplied
        entirely via <code className="demo-code">getChildRows</code>.
      </p>
      <div className="demo-split">
        <div className="demo-split__table">
          <table
            className="dt-parent-table"
            style={{ '--dt-parent-font': BODY_FONT } as React.CSSProperties}
          >
            <thead>
              <tr>
                <th className="dt-expand-col" />
                {DT_PARENT_HEADERS.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DT_PARENT_ROWS.map((row, ri) => {
                const isExpanded = expandedRows.has(row.id)
                const childRows = getChildRows(row)
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`dt-parent-row${isExpanded ? ' dt-parent-row--expanded' : ''}`}
                      style={{ height: rowHeights[ri] }}
                      onClick={() => toggle(row.id)}
                    >
                      <td className="dt-expand-col">
                        <span className="dt-expand-icon" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} style={{ width: DT_PARENT_COL_WIDTHS[ci] }}>{cell}</td>
                      ))}
                    </tr>
                    {isExpanded && (
                      <tr className="dt-child-row">
                        <td />
                        <td colSpan={DT_PARENT_COL_WIDTHS.length}>
                          <DetachableChildPanel rows={childRows} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useDetachable"
            code={`const { expandedRows, toggle, getChildRows } =
  useDetachable({ getChildRows: (row) => childData[row.id] })

// Parent measure — independent instance
const { rowHeights } = useMeasure(parentRows, colWidths)

// In the parent <tbody>:
{parentRows.map((row, i) => (<>
  <tr onClick={() => toggle(row.id)}
      style={{ height: rowHeights[i] }}>
    ...
  </tr>
  {expandedRows.has(row.id) && (
    <ChildPanel rows={getChildRows(row)} />
  )}
</>))}

// ChildPanel — owns its own useMeasure
function ChildPanel({ rows }) {
  const { rowHeights } = useMeasure(rows, childColWidths)
  return <table>...</table>
}`}
          />
        </div>
      </div>
    </section>
  )
}

// CanvasCellDemo — useCanvasCell: pixel-accurate canvas cell rendering
// ---------------------------------------------------------------------------

const CV_COLUMN_WIDTHS = [160, 300, 140]
const CV_HEADERS = ['Name', 'Role Summary', 'Department']
const CV_LINE_HEIGHT = 20
const CV_CELL_PADDING = 8

const CV_ROWS: Row[] = [
  { id: 'cv1', cells: ['Alice Johnson', 'Leads the frontend architecture team and establishes coding standards across all product surfaces.', 'Engineering'] },
  { id: 'cv2', cells: ['Bob Martinez', 'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.', 'Platform'] },
  { id: 'cv3', cells: ['Carol White', 'Manages the design system and ensures visual consistency from component library to page layouts.', 'Design'] },
  { id: 'cv4', cells: ['David Kim', 'Full-stack engineer who primarily owns the billing and subscription management subsystem.', 'Engineering'] },
  { id: 'cv5', cells: ['Eva Schulz', 'Data analyst responsible for dashboards, defining metrics, and running A/B test analyses.', 'Analytics'] },
]

function CanvasCellDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { rowHeights, prepared } = useMeasure(CV_ROWS, CV_COLUMN_WIDTHS, {
    lineHeight: CV_LINE_HEIGHT,
    cellPadding: CV_CELL_PADDING * 2,
    font: BODY_FONT,
  })

  const { drawCell } = useCanvasCell({
    prepared,
    columnWidths: CV_COLUMN_WIDTHS,
    options: {
      font: BODY_FONT,
      lineHeight: CV_LINE_HEIGHT,
      cellPadding: CV_CELL_PADDING,
      effect: { type: 'gradient', startColor: 'oklch(55% 0.20 260)', endColor: 'oklch(70% 0.18 330)' },
    },
  })

  const totalWidth = CV_COLUMN_WIDTHS.reduce((a, b) => a + b, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !prepared) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : null) ?? 1
    const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0)

    canvas.width = totalWidth * dpr
    canvas.height = totalHeight * dpr
    canvas.style.width = `${totalWidth}px`
    canvas.style.height = `${totalHeight}px`

    // Draw alternating row backgrounds
    ctx.save()
    let bgY = 0
    for (let ri = 0; ri < rowHeights.length; ri++) {
      ctx.fillStyle = ri % 2 === 0 ? 'oklch(14% 0.01 240)' : 'oklch(16% 0.01 240)'
      ctx.fillRect(0, bgY * dpr, totalWidth * dpr, rowHeights[ri]! * dpr)
      bgY += rowHeights[ri]!
    }
    ctx.restore()

    // Draw column separator lines
    ctx.save()
    ctx.strokeStyle = 'oklch(25% 0.02 240)'
    ctx.lineWidth = dpr
    let sepX = 0
    for (let ci = 0; ci < CV_COLUMN_WIDTHS.length - 1; ci++) {
      sepX += CV_COLUMN_WIDTHS[ci]!
      ctx.beginPath()
      ctx.moveTo(sepX * dpr, 0)
      ctx.lineTo(sepX * dpr, totalHeight * dpr)
      ctx.stroke()
    }
    ctx.restore()

    // Draw text cells with gradient effect via useCanvasCell
    let y = 0
    for (let ri = 0; ri < CV_ROWS.length; ri++) {
      let x = 0
      for (let ci = 0; ci < CV_COLUMN_WIDTHS.length; ci++) {
        drawCell(ctx, ri, ci, x, y, dpr)
        x += CV_COLUMN_WIDTHS[ci]!
      }
      y += rowHeights[ri]!
    }
  }, [drawCell, prepared, rowHeights, totalWidth])

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Canvas rendering · gradient cell effect</span>
      <h2 className="demo-section-title">useCanvasCell</h2>
      <p className="demo-section-desc">
        Renders table cells onto a <code className="demo-code">&lt;canvas&gt;</code>{' '}
        using positions from <code className="demo-code">layoutWithLines()</code> —
        never <code className="demo-code">ctx.measureText</code>. Supports{' '}
        <code className="demo-code">gradient</code>,{' '}
        <code className="demo-code">shadow</code>, and{' '}
        <code className="demo-code">fadeTruncation</code> effects. The gradient fill
        below is computed per-line without any DOM measurement.
      </p>
      <div className="demo-split">
        <div className="demo-split__table">
          <div className="cv-table-meta">
            {CV_HEADERS.map((h, i) => (
              <span key={i} className="demo-pill">{h} · {CV_COLUMN_WIDTHS[i]}px</span>
            ))}
          </div>
          <div className="cv-canvas-wrapper">
            <canvas ref={canvasRef} className="cv-canvas" />
          </div>
        </div>
        <div className="demo-split__code">
          <CodeSnippet
            label="useCanvasCell"
            code={`const { rowHeights, prepared } =
  useMeasure(rows, columnWidths)

const { drawCell } = useCanvasCell({
  prepared,
  columnWidths,
  options: {
    effect: {
      type: 'gradient',
      startColor: '#1e3a8a',
      endColor: '#7c3aed',
    },
  },
})

// In a useEffect paint loop:
drawCell(ctx, rowIndex, colIndex, x, y)`}
          />
        </div>
      </div>
    </section>
  )
}
