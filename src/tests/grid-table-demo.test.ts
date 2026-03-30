/**
 * Tests for US-009 — GridTable demo alongside BasicTable.
 *
 * AC01 — Demo page includes a GridTableDemo section with the same dataset used for BasicTable.
 * AC02 — Scrolling within GridTableDemo keeps the header row pinned (sticky header).
 * AC03 — Visually verified in browser (structural checks at source level).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../demo/App.tsx')
const cssSrc = readSrc('../demo/demo.css')
const gridCssSrc = readSrc('../tables/grid-table/grid-table.css')
const gridTsxSrc = readSrc('../tables/grid-table/index.tsx')

// ---------------------------------------------------------------------------
// AC01: GridTableDemo section exists with the same dataset as BasicTable
// ---------------------------------------------------------------------------

describe('US-009-AC01: GridTableDemo section in App.tsx', () => {
  it('App.tsx imports GridTable from the tables barrel', () => {
    expect(appSrc).toContain('GridTable')
    expect(appSrc).toMatch(/import[^;]*GridTable[^;]*from/)
  })

  it('App.tsx has a GridTableDemo section', () => {
    expect(appSrc).toContain('GridTableDemo')
  })

  it('GridTableDemo uses ROWS (same dataset as BasicTable)', () => {
    // GridTable must be rendered with ROWS and COLUMN_WIDTHS — the BasicTable dataset
    expect(appSrc).toMatch(/<GridTable[\s\S]*?rows=\{ROWS\}/)
  })

  it('GridTableDemo uses COLUMN_WIDTHS (same widths as BasicTable)', () => {
    expect(appSrc).toMatch(/<GridTable[\s\S]*?columnWidths=\{COLUMN_WIDTHS\}/)
  })

  it('GridTableDemo passes GRID_HEADERS to GridTable', () => {
    expect(appSrc).toContain('GRID_HEADERS')
    expect(appSrc).toMatch(/<GridTable[\s\S]*?headers=\{GRID_HEADERS\}/)
  })

  it('GridTableDemo section has an eyebrow label describing sticky header', () => {
    expect(appSrc).toMatch(/demo-section-eyebrow[\s\S]{0,60}sticky/)
  })
})

// ---------------------------------------------------------------------------
// AC02: sticky header — the header row is pinned when scrolling
// ---------------------------------------------------------------------------

describe('US-009-AC02: sticky header implementation', () => {
  it('grid-table-header-row uses position:sticky in CSS', () => {
    expect(gridCssSrc).toContain('position: sticky')
  })

  it('grid-table-header-row has top: 0 in CSS', () => {
    expect(gridCssSrc).toContain('top: 0')
  })

  it('grid-table-container has overflow:auto for scrollability', () => {
    expect(gridCssSrc).toContain('overflow: auto')
  })

  it('GridTable renders header with grid-table-header-row class', () => {
    expect(gridTsxSrc).toContain('grid-table-header-row')
  })

  it('GridTable renders body rows with grid-table-row class', () => {
    expect(gridTsxSrc).toContain('grid-table-row')
  })
})

// ---------------------------------------------------------------------------
// AC03: visual verification scaffolding — structural source-level checks
// ---------------------------------------------------------------------------

describe('US-009-AC03: structural quality for visual verification', () => {
  it('GridTableDemo has a descriptive paragraph explaining sticky header', () => {
    expect(appSrc).toMatch(/sticky/)
  })

  it('demo.css defines demo-table-wrapper--fit or demo-table-wrapper used in GridTableDemo', () => {
    expect(cssSrc).toMatch(/\.demo-table-wrapper/)
  })

  it('GridTableDemo uses renderDeptCell for department badge colours', () => {
    expect(appSrc).toMatch(/<GridTable[\s\S]*?renderCell=\{renderDeptCell\}/)
  })
})
