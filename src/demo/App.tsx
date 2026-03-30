import React, { useState, useMemo, useEffect, useRef } from 'react'
import { BasicTable, ColumnControlsTable, DraggableTable, ExpandableTable, ResizableTable, VirtualizedTable } from '../tables/index.js'
import type { Row } from '../shared/types.js'
import { useMeasure, useShrinkWrap, useResizable, useResizePreview, useScrollAnchor } from '../shared/hooks/index.js'
import { BODY_FONT, HEADER_FONT } from '../shared/fonts.js'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
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
          <span className="demo-section-eyebrow">Ghost preview · Column drag</span>
          <h2 className="demo-section-title">useResizePreview</h2>
          <p className="demo-section-desc">
            Drag a column handle to see a ghost preview of the new row heights
            before committing. The orange bars show where rows would break — no
            DOM reads, computed with <code className="demo-code">layout()</code> on
            every pointer move.
          </p>
          <ResizePreviewDemo />
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
          <span className="demo-section-eyebrow">Sortable + Visibility · Sticky first column</span>
          <h2 className="demo-section-title">ColumnControlsTable</h2>
          <p className="demo-section-desc">
            Toggle columns on/off with the checkboxes above the table. Click
            any header to sort. The first column stays sticky as you scroll
            right. Hidden columns are fully removed from layout and
            measurement — at least one column always stays visible.
          </p>

          <div className="demo-table-meta">
            <span className="demo-pill">Name · 190px</span>
            <span className="demo-pill">Role Summary · 300px</span>
            <span className="demo-pill">Department · 160px</span>
            <span className="demo-pill">Status · 120px</span>
            <span className="demo-pill">Location · 160px</span>
          </div>

          <div className="demo-table-wrapper">
            <ColumnControlsTable
              rows={CC_ROWS}
              columns={CC_COLUMNS}
              columnWidths={CC_COLUMN_WIDTHS}
              maxHeight={320}
              renderCell={renderCCCell}
            />
          </div>
        </section>

        <DraggableDemo />

        <ShrinkWrapDemo />

        <ScrollAnchorDemo />
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

// ---------------------------------------------------------------------------
// ResizePreviewDemo
// ---------------------------------------------------------------------------

const RP_DEFAULT_WIDTHS = [180, 320, 160]
const RP_LINE_HEIGHT = 20
const RP_CELL_PADDING = 16
const RP_HEADERS = ['Name', 'Role Summary', 'Department']
const RP_MIN_COL = 60

function ResizePreviewDemo() {
  const { columnWidths, getColHandleProps, previewDragState } =
    useResizable({
      defaultColumnWidths: RP_DEFAULT_WIDTHS,
      minColumnWidth: RP_MIN_COL,
      horizontal: true,
      rowCount: ROWS.length,
    })

  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)) }, [])

  const prepared = useMemo(() => {
    if (!fontsReady) return null
    return ROWS.map((row) => row.cells.map((cell) => prepareWithSegments(cell, BODY_FONT)))
  }, [fontsReady])

  const rowHeights = useMeasure(ROWS, columnWidths, { lineHeight: RP_LINE_HEIGHT, cellPadding: RP_CELL_PADDING })
  const { previewHeights } = useResizePreview(prepared, previewDragState, {
    columnWidths,
    lineHeight: RP_LINE_HEIGHT,
    cellPadding: RP_CELL_PADDING,
  })

  const isDragging = previewDragState !== null

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Actual table */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="demo-table-meta" style={{ marginBottom: '8px' }}>
          {RP_HEADERS.map((h, i) => (
            <span key={i} className="demo-pill">{h} · {Math.round(columnWidths[i]!)}px</span>
          ))}
        </div>
        <div className="demo-table-wrapper" style={{ position: 'relative' }}>
          <table
            style={
              {
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                width: columnWidths.reduce((a, b) => a + b, 0),
                font: BODY_FONT,
              } as React.CSSProperties
            }
          >
            <thead>
              <tr>
                {RP_HEADERS.map((h, colIndex) => (
                  <th
                    key={colIndex}
                    style={{
                      width: columnWidths[colIndex],
                      maxWidth: columnWidths[colIndex],
                      padding: '8px',
                      font: HEADER_FONT,
                      textAlign: 'left',
                      borderBottom: '2px solid oklch(30% 0 0)',
                      position: 'relative',
                      userSelect: 'none',
                    }}
                  >
                    {h}
                    {colIndex < RP_HEADERS.length - 1 && (
                      <span
                        {...getColHandleProps(colIndex)}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 6,
                          cursor: 'col-resize',
                          background: isDragging && previewDragState?.colIndex === colIndex
                            ? 'oklch(65% 0.18 50)'
                            : 'oklch(35% 0 0)',
                        }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIndex) => (
                <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
                  {row.cells.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        width: columnWidths[colIndex],
                        maxWidth: columnWidths[colIndex],
                        padding: '8px',
                        verticalAlign: 'top',
                        borderBottom: '1px solid oklch(22% 0 0)',
                        overflow: 'hidden',
                      }}
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
      <div style={{ width: 160, flexShrink: 0 }}>
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isDragging ? 'oklch(65% 0.18 50)' : 'oklch(45% 0 0)',
            marginBottom: '8px',
            transition: 'color 150ms',
          }}
        >
          {isDragging
            ? `Preview · col ${(previewDragState?.colIndex ?? 0) + 1} → ${Math.round(previewDragState?.currentWidth ?? 0)}px`
            : 'Drag a handle →'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rowHeights.map((committed, i) => {
            const preview = previewHeights?.[i] ?? null
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: Math.max(committed, preview ?? 0),
                }}
              >
                {/* committed height bar */}
                <div
                  style={{
                    width: 10,
                    height: committed,
                    background: 'oklch(35% 0 0)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                {/* preview height bar */}
                {preview !== null && (
                  <div
                    style={{
                      width: 10,
                      height: preview,
                      background: preview > committed
                        ? 'oklch(65% 0.18 50)'
                        : 'oklch(55% 0.15 145)',
                      borderRadius: 2,
                      flexShrink: 0,
                      transition: 'height 0ms',
                    }}
                  />
                )}
                <span style={{ fontSize: 10, color: 'oklch(50% 0 0)' }}>
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
  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    return SW_ROWS.map((row) => row.cells.map((cell) => prepareWithSegments(cell, BODY_FONT)))
  }, [fontsReady])

  const rowHeights = useMeasure(SW_ROWS, columnWidths, { font: BODY_FONT })
  const { fitColumn } = useShrinkWrap(prepared, columnWidths)

  function handleFit(colIndex: number) {
    const w = fitColumn(colIndex)
    setColumnWidths((prev) => prev.map((v, i) => (i === colIndex ? w : v)))
  }

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Shrink-wrap · Binary-search fit</span>
      <h2 className="demo-section-title">useShrinkWrap</h2>
      <p className="demo-section-desc">
        Click a <em>Fit</em> button to snap the column to the narrowest width
        where no cell text wraps. Uses binary search over{' '}
        <code className="demo-code">walkLineRanges()</code> — zero DOM
        measurements, zero reflows.
      </p>

      <div className="demo-shrinkwrap-controls">
        {SW_HEADERS.map((header, i) => (
          <button key={i} className="demo-fit-btn" onClick={() => handleFit(i)}>
            Fit: {header}
          </button>
        ))}
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
          style={
            {
              '--font-body': BODY_FONT,
              '--font-header': HEADER_FONT,
            } as React.CSSProperties
          }
        >
          <thead>
            <tr>
              {SW_HEADERS.map((h, i) => (
                <th key={i} style={{ width: columnWidths[i] }}>
                  {h}
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowHeights = useMeasure(rows, SA_COLUMN_WIDTHS)
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

  return (
    <section className="demo-section">
      <span className="demo-section-eyebrow">Scroll anchor · Prepend without jump</span>
      <h2 className="demo-section-title">useScrollAnchor</h2>
      <p className="demo-section-desc">
        Click <em>Load older messages</em> to prepend rows. The currently
        visible content stays stable — <code className="demo-code">scrollTop</code>{' '}
        is corrected atomically using pretext-computed offsets before the browser
        paints. No <code className="demo-code">getBoundingClientRect</code>, no{' '}
        <code className="demo-code">scrollHeight</code> reads.
      </p>

      <div className="demo-shrinkwrap-controls">
        <button className="demo-fit-btn" onClick={handlePrepend}>
          ↑ Load older messages
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          height: 320,
          overflowY: 'auto',
          border: '1px solid oklch(30% 0.02 240)',
          borderRadius: 6,
        }}
      >
        <table
          className="demo-sw-table"
          style={
            {
              '--font-body': BODY_FONT,
              '--font-header': HEADER_FONT,
            } as React.CSSProperties
          }
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
    </section>
  )
}
