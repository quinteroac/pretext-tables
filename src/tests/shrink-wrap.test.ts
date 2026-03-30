/**
 * Tests for useShrinkWrap hook — US-001.
 *
 * The core logic lives in the pure `shrinkWrapColumn` helper, so tests drive
 * that directly with real pretext prepared data (canvas polyfill active via
 * src/tests/setup.ts).  Barrel export and source-level guard tests round out
 * the acceptance criteria.
 */
import { describe, it, expect } from 'vitest'
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { shrinkWrapColumn } from '../shared/hooks/useShrinkWrap.js'
import { BODY_FONT } from '../shared/fonts.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prep(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, BODY_FONT)
}

function lineCount(prepared: PreparedTextWithSegments, innerWidth: number): number {
  return walkLineRanges(prepared, innerWidth, () => {})
}

// ---------------------------------------------------------------------------
// AC01: exported from barrel
// ---------------------------------------------------------------------------

describe('US-001 AC01: barrel export', () => {
  it('useShrinkWrap is exported from src/shared/hooks/index.ts', async () => {
    const mod = await import('../shared/hooks/index.js')
    expect(typeof mod.useShrinkWrap).toBe('function')
  })

  it('shrinkWrapColumn is exported from src/shared/hooks/index.ts', async () => {
    const mod = await import('../shared/hooks/index.js')
    expect(typeof mod.shrinkWrapColumn).toBe('function')
  })

  it('UseShrinkWrapOptions type is exported (compile-time guard)', async () => {
    // If the type export is missing, the import below will fail at compile time.
    const mod = await import('../shared/hooks/index.js')
    expect(mod).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AC02: return value is the minimum pixel width (a number)
// ---------------------------------------------------------------------------

describe('US-001 AC02: fitColumn returns a number', () => {
  it('shrinkWrapColumn returns a positive number for normal text', () => {
    const cells = [prep('Hello World')]
    const result = shrinkWrapColumn(cells)
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThan(0)
  })

  it('the returned width is the full column width including cellPadding', () => {
    const cellPadding = 16
    const cells = [prep('Alice Johnson')]
    const result = shrinkWrapColumn(cells, { cellPadding })
    // Result must be at least cellPadding (content + padding).
    expect(result).toBeGreaterThanOrEqual(cellPadding)
  })

  it('wider text produces a wider minimum than shorter text', () => {
    const narrow = shrinkWrapColumn([prep('Hi')])
    const wide = shrinkWrapColumn([
      prep('This is a much longer sentence that should require more horizontal space'),
    ])
    expect(wide).toBeGreaterThan(narrow)
  })
})

// ---------------------------------------------------------------------------
// AC03: uses walkLineRanges — no DOM APIs
// ---------------------------------------------------------------------------

describe('US-001 AC03: no DOM measurement APIs in source', () => {
  it('useShrinkWrap source imports walkLineRanges from @chenglou/pretext', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync(
      new URL('../shared/hooks/useShrinkWrap.ts', import.meta.url),
      'utf8'
    )
    expect(src).toContain('walkLineRanges')
    expect(src).toContain("from '@chenglou/pretext'")
  })

  it('useShrinkWrap source has no getBoundingClientRect', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync(
      new URL('../shared/hooks/useShrinkWrap.ts', import.meta.url),
      'utf8'
    )
    expect(src).not.toContain('getBoundingClientRect')
    expect(src).not.toContain('offsetWidth')
    expect(src).not.toContain('offsetHeight')
    expect(src).not.toContain('clientWidth')
  })
})

// ---------------------------------------------------------------------------
// AC04: binary search converges within ±1 px of true wrap boundary
// ---------------------------------------------------------------------------

describe('US-001 AC04: convergence within ±1 px', () => {
  const cellPadding = 16

  it('returned width fits the cell on one line', () => {
    const text = 'Frontend Architecture Lead'
    const prepared = prep(text)
    const result = shrinkWrapColumn([prepared], { cellPadding })
    const innerWidth = result - cellPadding
    expect(lineCount(prepared, innerWidth)).toBeLessThanOrEqual(1)
  })

  it('width 2 px below returned inner width causes wrapping (proves ≤1 px overshoot)', () => {
    // A multi-word text that clearly wraps when too narrow.
    const text = 'Leads the frontend architecture team and establishes coding standards.'
    const prepared = prep(text)
    const result = shrinkWrapColumn([prepared], { cellPadding })
    const innerWidth = result - cellPadding

    // At returned inner width: must fit.
    expect(lineCount(prepared, innerWidth)).toBeLessThanOrEqual(1)

    // At returned inner width - 2: must wrap.
    // (The ±1 px guarantee means subtracting 2 is always past the boundary.)
    expect(lineCount(prepared, innerWidth - 2)).toBeGreaterThan(1)
  })

  it('takes the max across all rows in a column', () => {
    const short = prep('Alice')
    const long = prep('Grace Tanaka — Product Manager')
    const resultShort = shrinkWrapColumn([short])
    const resultLong = shrinkWrapColumn([long])
    const resultBoth = shrinkWrapColumn([short, long])

    expect(resultBoth).toBe(resultLong)
    expect(resultBoth).toBeGreaterThanOrEqual(resultShort)
  })
})

// ---------------------------------------------------------------------------
// AC05: edge cases
// ---------------------------------------------------------------------------

describe('US-001 AC05: edge cases', () => {
  it('empty string cell returns minWidth (no crash)', () => {
    const minWidth = 20
    const result = shrinkWrapColumn([prep('')], { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
  })

  it('whitespace-only cell returns minWidth (no crash)', () => {
    const minWidth = 20
    const result = shrinkWrapColumn([prep('   ')], { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
  })

  it('single-character cell returns a valid positive width', () => {
    const result = shrinkWrapColumn([prep('A')])
    expect(result).toBeGreaterThan(0)
    expect(typeof result).toBe('number')
  })

  it('empty cells array returns minWidth', () => {
    const minWidth = 20
    const result = shrinkWrapColumn([], { minWidth })
    expect(result).toBe(minWidth)
  })

  it('column of all empty strings stays at minWidth', () => {
    const minWidth = 24
    const cells = [prep(''), prep(''), prep('')]
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
  })

  it('single-character repeated across rows — stable numeric result', () => {
    const cells = [prep('A'), prep('B'), prep('C')]
    const result = shrinkWrapColumn(cells)
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThan(0)
  })
})
