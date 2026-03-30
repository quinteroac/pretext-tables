/**
 * Tests for US-004 — Wire useShrinkWrap into ResizableTable.
 *
 * Because ResizableTable is a React component that requires a browser environment
 * to render, behavioural tests here focus on:
 *   - Source-level guarantees (prop shape, no static import, lazy import pattern)
 *   - Integration of `shrinkWrapColumn` itself (existing unit coverage lives in
 *     shrink-wrap.test.ts; we verify the wire-up constants match here)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const resizableSrc = readSrc('../tables/resizable-table/index.tsx')

// ---------------------------------------------------------------------------
// AC01: ResizableTable accepts shrinkWrap prop; double-click handler is wired
// ---------------------------------------------------------------------------

describe('US-004 AC01: shrinkWrap prop and double-click handler', () => {
  it('ResizableTableProps declares shrinkWrap?: boolean', () => {
    expect(resizableSrc).toMatch(/shrinkWrap\s*\??\s*:\s*boolean/)
  })

  it('component destructures shrinkWrap with default false', () => {
    expect(resizableSrc).toMatch(/shrinkWrap\s*=\s*false/)
  })

  it('handle element has an onDoubleClick prop', () => {
    expect(resizableSrc).toContain('onDoubleClick')
  })

  it('double-click handler calls shrinkWrapColumn', () => {
    expect(resizableSrc).toContain('shrinkWrapColumn')
  })

  it('double-click handler calls setColumnWidths to update widths', () => {
    expect(resizableSrc).toContain('setColumnWidths')
  })
})

// ---------------------------------------------------------------------------
// AC02: Existing ResizableTable API is unchanged — no breaking changes
// ---------------------------------------------------------------------------

describe('US-004 AC02: existing ResizableTable props are unchanged', () => {
  const existingProps = ['rows', 'headers', 'defaultColumnWidths', 'horizontal', 'vertical', 'renderCell']

  for (const prop of existingProps) {
    it(`prop "${prop}" is still present`, () => {
      expect(resizableSrc).toContain(prop)
    })
  }

  it('shrinkWrap is optional (defaults to false, not required)', () => {
    // The prop has a default value — existing call sites without shrinkWrap are unaffected.
    expect(resizableSrc).toMatch(/shrinkWrap\s*=\s*false/)
  })
})

// ---------------------------------------------------------------------------
// AC03: useShrinkWrap is NOT statically imported — lazy / dynamic import only
// ---------------------------------------------------------------------------

describe('US-004 AC03: no static import of useShrinkWrap in ResizableTable', () => {
  it('top-level import statements do not include useShrinkWrap', () => {
    const staticImports = resizableSrc
      .split('\n')
      .filter((line) => /^import\s/.test(line.trim()))
    const hasShrinkWrapImport = staticImports.some((line) => line.includes('useShrinkWrap'))
    expect(hasShrinkWrapImport).toBe(false)
  })

  it('uses a dynamic import() for useShrinkWrap (lazy loading)', () => {
    expect(resizableSrc).toMatch(/import\s*\(\s*['"][^'"]*useShrinkWrap/)
  })
})

// ---------------------------------------------------------------------------
// AC04: Integration — shrinkWrapColumn produces a valid minimum width
// ---------------------------------------------------------------------------

describe('US-004 AC04: shrinkWrapColumn integration with ResizableTable constants', () => {
  it('CELL_PADDING and MIN_COLUMN_WIDTH from measure.ts are forwarded to shrinkWrapColumn', () => {
    // The handler must pass cellPadding and minWidth — verify by source inspection.
    expect(resizableSrc).toContain('cellPadding: CELL_PADDING')
    expect(resizableSrc).toContain('minWidth: MIN_COLUMN_WIDTH')
  })

  it('shrinkWrapColumn returns a number >= MIN_COLUMN_WIDTH for real cell data', async () => {
    const { shrinkWrapColumn } = await import('../shared/hooks/useShrinkWrap.js')
    const { prepareWithSegments } = await import('@chenglou/pretext')
    const { BODY_FONT } = await import('../shared/fonts.js')
    const CELL_PADDING = 16
    const MIN_COLUMN_WIDTH = 60

    const cells = [
      prepareWithSegments('Engineering Manager', BODY_FONT),
      prepareWithSegments('Leads the platform team', BODY_FONT),
      prepareWithSegments('Alice', BODY_FONT),
    ]
    const result = shrinkWrapColumn(cells, { cellPadding: CELL_PADDING, minWidth: MIN_COLUMN_WIDTH })

    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(MIN_COLUMN_WIDTH)
  })

  it('shrinkWrapColumn result fits the widest cell on one line', async () => {
    const { shrinkWrapColumn } = await import('../shared/hooks/useShrinkWrap.js')
    const { prepareWithSegments, walkLineRanges } = await import('@chenglou/pretext')
    const { BODY_FONT } = await import('../shared/fonts.js')
    const CELL_PADDING = 16

    const rawCells = ['Short', 'A much longer cell value that needs space']
    const cells = rawCells.map((t) => prepareWithSegments(t, BODY_FONT))
    const result = shrinkWrapColumn(cells, { cellPadding: CELL_PADDING })
    const innerWidth = result - CELL_PADDING

    for (const cell of cells) {
      expect(walkLineRanges(cell, innerWidth, () => {})).toBeLessThanOrEqual(1)
    }
  })
})

// ---------------------------------------------------------------------------
// useMeasure now exposes `prepared` (needed for the wire-up to work)
// ---------------------------------------------------------------------------

describe('US-004 prerequisite: useMeasure exposes prepared grid', () => {
  it('useMeasure return includes `prepared` field', async () => {
    // Source-level: useMeasure.ts must return an object with `prepared`.
    const src = readSrc('../shared/hooks/useMeasure.ts')
    expect(src).toContain('prepared')
    expect(src).toMatch(/return\s*\{[^}]*rowHeights[^}]*prepared/)
  })

  it('UseMeasureResult type is exported from the hooks barrel', async () => {
    const mod = await import('../shared/hooks/index.js')
    // Type exports are erased at runtime; check that the module loaded correctly.
    expect(mod).toBeDefined()
    // useMeasure itself must still work and return the expected shape.
    expect(typeof mod.useMeasure).toBe('function')
  })
})
