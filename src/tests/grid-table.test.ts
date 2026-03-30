/**
 * Tests for GridTable — US-008
 *
 * AC01 — renders using display:grid divs (no table/tr/td elements)
 * AC02 — grid-template-columns is derived from columnWidths
 * AC03 — rowHeight from useMeasure applied as explicit height on each row div
 * AC04 — header row is position:sticky; top:0
 * AC05 — overflow:hidden on cells clips content
 * AC06 — component lives at src/tables/grid-table/ with expected files
 * AC07 — exported from src/tables/index.ts
 * AC08 — typecheck passes (structural)
 */
import { describe, it, expect } from 'vitest'
import { GridTable } from '../tables/grid-table/index.js'
import type { GridTableProps } from '../tables/grid-table/index.js'
import { GridTable as GridTableFromBarrel } from '../tables/index.js'
import { LINE_HEIGHT, CELL_PADDING, MIN_COLUMN_WIDTH } from '../tables/grid-table/measure.js'
import { renderToString } from 'react-dom/server'
import React from 'react'
import type { Row } from '../shared/types.js'

const SAMPLE_HEADERS = ['Name', 'Role', 'Status']
const SAMPLE_ROWS: Row[] = [
  { id: 'r1', cells: ['Alice', 'Engineer', 'Active'] },
  { id: 'r2', cells: ['Bob', 'Designer', 'Active'] },
  { id: 'r3', cells: ['Carol', 'Manager', 'On leave'] },
]
const COLUMN_WIDTHS = [150, 150, 100]

// ---------------------------------------------------------------------------
// AC07: exported from src/tables/index.ts
// ---------------------------------------------------------------------------

describe('US-008-AC07: barrel export', () => {
  it('GridTable is exported from src/tables/index.ts', () => {
    expect(GridTableFromBarrel).toBeDefined()
    expect(typeof GridTableFromBarrel).toBe('function')
  })

  it('GridTable from barrel equals GridTable from direct import', () => {
    expect(GridTableFromBarrel).toBe(GridTable)
  })
})

// ---------------------------------------------------------------------------
// AC06: measure.ts exports numeric constants only
// ---------------------------------------------------------------------------

describe('US-008-AC06: measure.ts constants', () => {
  it('exports LINE_HEIGHT as a positive number', () => {
    expect(typeof LINE_HEIGHT).toBe('number')
    expect(LINE_HEIGHT).toBeGreaterThan(0)
  })

  it('exports CELL_PADDING as a positive number', () => {
    expect(typeof CELL_PADDING).toBe('number')
    expect(CELL_PADDING).toBeGreaterThan(0)
  })

  it('exports MIN_COLUMN_WIDTH as a positive number', () => {
    expect(typeof MIN_COLUMN_WIDTH).toBe('number')
    expect(MIN_COLUMN_WIDTH).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// AC08: TypeScript prop contract
// ---------------------------------------------------------------------------

describe('US-008-AC08: GridTableProps type contract', () => {
  it('accepts required props without TypeScript error', () => {
    const props: GridTableProps = {
      rows: SAMPLE_ROWS,
      headers: SAMPLE_HEADERS,
      columnWidths: COLUMN_WIDTHS,
    }
    expect(props.rows).toHaveLength(3)
    expect(props.headers).toHaveLength(3)
    expect(props.columnWidths).toHaveLength(3)
  })

  it('accepts optional renderCell prop', () => {
    const props: GridTableProps = {
      rows: SAMPLE_ROWS,
      headers: SAMPLE_HEADERS,
      columnWidths: COLUMN_WIDTHS,
      renderCell: (value) => value.toUpperCase(),
    }
    expect(props.renderCell).toBeDefined()
    expect(typeof props.renderCell).toBe('function')
  })

  it('renderCell is optional (defaults to undefined)', () => {
    const props: GridTableProps = {
      rows: SAMPLE_ROWS,
      headers: SAMPLE_HEADERS,
      columnWidths: COLUMN_WIDTHS,
    }
    expect(props.renderCell).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// AC01: no <table>, <tr>, <td> elements; AC02: grid-template-columns
// AC03: row height; AC04: sticky header; AC05: overflow:hidden
// ---------------------------------------------------------------------------

describe('US-008-AC01/02/03/04/05: rendered HTML structure', () => {
  function render(props: GridTableProps): string {
    return renderToString(React.createElement(GridTable, props))
  }

  it('AC01: renders no <table>, <tr>, or <td> elements', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).not.toMatch(/<table[\s>]/i)
    expect(html).not.toMatch(/<tr[\s>]/i)
    expect(html).not.toMatch(/<td[\s>]/i)
  })

  it('AC01: renders <div> elements as its root and cells', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).toMatch(/<div/)
  })

  it('AC02: grid-template-columns is derived from columnWidths', () => {
    const widths = [200, 100, 80]
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: widths })
    const expected = '200px 100px 80px'
    expect(html).toContain(expected)
  })

  it('AC02: each column width appears in grid-template-columns', () => {
    const widths = [300, 150, 120]
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: widths })
    expect(html).toContain('300px 150px 120px')
  })

  it('AC04: header row has sticky class', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).toContain('grid-table-header-row')
  })

  it('AC04: header cell class is present', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).toContain('grid-table-header-cell')
    SAMPLE_HEADERS.forEach((header) => {
      expect(html).toContain(header)
    })
  })

  it('AC03: each body row has the grid-table-row class', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    const rowMatches = html.match(/grid-table-row/g) ?? []
    // At least one match per data row (SAMPLE_ROWS.length)
    expect(rowMatches.length).toBeGreaterThanOrEqual(SAMPLE_ROWS.length)
  })

  it('AC03: body rows have an explicit height style', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    // Each row should have height:<number>px in its style attribute
    const heightMatches = html.match(/height:\s*\d+(\.\d+)?px/g) ?? []
    expect(heightMatches.length).toBeGreaterThanOrEqual(SAMPLE_ROWS.length)
  })

  it('AC05: cell divs have the grid-table-cell class', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    const cellMatches = html.match(/grid-table-cell/g) ?? []
    // At least one cell per row*col
    expect(cellMatches.length).toBeGreaterThanOrEqual(SAMPLE_ROWS.length * SAMPLE_ROWS[0].cells.length)
  })

  it('renders cell content', () => {
    const html = render({ rows: SAMPLE_ROWS, headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).toContain('Alice')
    expect(html).toContain('Engineer')
    expect(html).toContain('Carol')
  })

  it('calls renderCell when provided', () => {
    const html = render({
      rows: SAMPLE_ROWS,
      headers: SAMPLE_HEADERS,
      columnWidths: COLUMN_WIDTHS,
      renderCell: (value) => `[${value}]`,
    })
    expect(html).toContain('[Alice]')
    expect(html).toContain('[Engineer]')
  })

  it('renders with empty rows without error', () => {
    const html = render({ rows: [], headers: SAMPLE_HEADERS, columnWidths: COLUMN_WIDTHS })
    expect(html).toContain('grid-table-header-row')
    expect(html).not.toContain('grid-table-row')
  })
})
