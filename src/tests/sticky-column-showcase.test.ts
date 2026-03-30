/**
 * Tests for US-002 — Wire useStickyColumns into the sticky-column showcase.
 *
 * Uses source-level checks (readFileSync) to verify structural guarantees,
 * following the pattern established in demo-sections.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../demo/App.tsx')

// ---------------------------------------------------------------------------
// AC01: useStickyColumns called with frozenCount: 1; frozenWidths/scrollWidths used
// ---------------------------------------------------------------------------

describe('US-002 AC01: useStickyColumns wired into showcase', () => {
  it('App.tsx imports useStickyColumns', () => {
    expect(appSrc).toContain('useStickyColumns')
  })

  it('App.tsx imports useColumnControls', () => {
    expect(appSrc).toContain('useColumnControls')
  })

  it('App.tsx calls useStickyColumns with frozenCount: 1', () => {
    expect(appSrc).toMatch(/useStickyColumns\s*\(\s*\{[^}]*frozenCount\s*:\s*1/)
  })

  it('App.tsx uses frozenWidths from useStickyColumns', () => {
    expect(appSrc).toContain('frozenWidths')
  })

  it('App.tsx uses scrollWidths from useStickyColumns', () => {
    expect(appSrc).toContain('scrollWidths')
  })
})

// ---------------------------------------------------------------------------
// AC02: frozen pane uses position:sticky; left:0
// ---------------------------------------------------------------------------

describe('US-002 AC02: frozen column has position:sticky', () => {
  it('App.tsx sets position: sticky on frozen cells', () => {
    expect(appSrc).toMatch(/position\s*:\s*['"]sticky['"]/)
  })

  it('App.tsx sets left: 0 for the first frozen cell', () => {
    // leftOffset for fi=0 is 0 (frozenWidths.slice(0,0) reduces to 0)
    expect(appSrc).toMatch(/leftOffset/)
    // leftOffset is computed via reduce starting at 0
    expect(appSrc).toMatch(/reduce\s*\(\s*\([^)]+\)\s*=>[^,]+,\s*0\s*\)/)
  })
})

// ---------------------------------------------------------------------------
// AC03: single useMeasure call with all widths (frozen + scrollable)
// ---------------------------------------------------------------------------

describe('US-002 AC03: single useMeasure with all widths', () => {
  it('App.tsx calls useMeasure with frozenWidths.concat(scrollWidths)', () => {
    expect(appSrc).toMatch(/useMeasure\s*\([^)]*frozenWidths\.concat\s*\(\s*scrollWidths\s*\)/)
  })
})

// ---------------------------------------------------------------------------
// AC04: no bespoke column-slicing — all flows through useStickyColumns
// ---------------------------------------------------------------------------

describe('US-002 AC04: column partitioning goes through useStickyColumns', () => {
  it('frozenCols is derived from frozenWidths.length (not a hard-coded slice)', () => {
    expect(appSrc).toMatch(/frozenCols\s*=\s*visibleColumns\.slice\s*\(\s*0\s*,\s*frozenWidths\.length\s*\)/)
  })

  it('scrollCols is derived from frozenWidths.length (not a hard-coded slice)', () => {
    expect(appSrc).toMatch(/scrollCols\s*=\s*visibleColumns\.slice\s*\(\s*frozenWidths\.length\s*\)/)
  })
})

// ---------------------------------------------------------------------------
// AC05: no new table component in src/tables/
// ---------------------------------------------------------------------------

describe('US-002 AC05: no new table component added', () => {
  it('App.tsx does not import a StickyTable or StickyColumnTable component', () => {
    expect(appSrc).not.toMatch(/import.*Sticky(?:Column)?Table/)
  })

  it('StickyColumnShowcase is defined inline in App.tsx (not in src/tables/)', () => {
    expect(appSrc).toContain('function StickyColumnShowcase')
  })
})

// ---------------------------------------------------------------------------
// AC07: source quality — fonts from shared constants, no DOM measurement
// ---------------------------------------------------------------------------

describe('US-002 AC07: source quality guards', () => {
  it('StickyColumnShowcase uses BODY_FONT constant, no inline font string', () => {
    expect(appSrc).toContain('BODY_FONT')
  })

  it('StickyColumnShowcase uses HEADER_FONT constant, no inline font string', () => {
    expect(appSrc).toContain('HEADER_FONT')
  })

  it('App.tsx does not call getBoundingClientRect for cell sizing', () => {
    expect(appSrc).not.toMatch(/\bgetBoundingClientRect\s*\(/)
  })
})
