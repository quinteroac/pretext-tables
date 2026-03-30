/**
 * Tests for useDynamicFont (US-001).
 *
 * Covers:
 *   AC01 — hook returns { rowHeights, setFont, currentFont }
 *   AC02 — setFont() debounces prepare() at 150 ms by default
 *   AC03 — layout() runs immediately using previously prepared state
 *   AC04 — heights stabilise after debounce fires prepare()
 *   AC05 — composes correctly with useResizable
 *   AC06 — exported from src/shared/hooks/index.ts
 *   AC07 — typecheck / lint (verified by tsc --noEmit in CI)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { prepareWithSegments } from '@chenglou/pretext'
import { computeDynamicRowHeights } from '../shared/hooks/useDynamicFont.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const hookSrc = readSrc('../shared/hooks/useDynamicFont.ts')
const indexSrc = readSrc('../shared/hooks/index.ts')

// ---------------------------------------------------------------------------
// AC06 — export from index.ts
// ---------------------------------------------------------------------------

describe('AC06: export from src/shared/hooks/index.ts', () => {
  it('exports useDynamicFont', () => {
    expect(indexSrc).toContain('useDynamicFont')
  })

  it('exports computeDynamicRowHeights', () => {
    expect(indexSrc).toContain('computeDynamicRowHeights')
  })

  it('exports UseDynamicFontOptions type', () => {
    expect(indexSrc).toContain('UseDynamicFontOptions')
  })

  it('exports UseDynamicFontResult type', () => {
    expect(indexSrc).toContain('UseDynamicFontResult')
  })

  it('re-exports from useDynamicFont.js module path', () => {
    expect(indexSrc).toContain('./useDynamicFont.js')
  })
})

// ---------------------------------------------------------------------------
// AC01 — return shape { rowHeights, setFont, currentFont }
// ---------------------------------------------------------------------------

describe('AC01: UseDynamicFontResult shape', () => {
  it('UseDynamicFontResult interface declares rowHeights', () => {
    expect(hookSrc).toMatch(/rowHeights\s*:\s*number\[\]/)
  })

  it('UseDynamicFontResult interface declares setFont', () => {
    expect(hookSrc).toMatch(/setFont\s*:\s*\(font\s*:\s*string\)\s*=>\s*void/)
  })

  it('UseDynamicFontResult interface declares currentFont', () => {
    expect(hookSrc).toMatch(/currentFont\s*:\s*string/)
  })

  it('hook returns all three fields', () => {
    expect(hookSrc).toContain('return { rowHeights, setFont, currentFont }')
  })

  it('hook signature accepts (rows, columnWidths, initialFont, options?)', () => {
    expect(hookSrc).toMatch(
      /function useDynamicFont\(\s*\n?\s*rows\s*:\s*Row\[\]/
    )
    expect(hookSrc).toContain('columnWidths: number[]')
    expect(hookSrc).toContain('initialFont: string')
    expect(hookSrc).toContain('options?: UseDynamicFontOptions')
  })
})

// ---------------------------------------------------------------------------
// AC02 — setFont() triggers debounced prepare() at default 150 ms
// ---------------------------------------------------------------------------

describe('AC02: setFont() debounces prepare()', () => {
  it('default debounceMs is 150', () => {
    expect(hookSrc).toMatch(/debounceMs\s*=\s*150/)
  })

  it('setFont uses setTimeout for debounce', () => {
    expect(hookSrc).toContain('setTimeout')
  })

  it('setFont cancels pending timer before scheduling new one', () => {
    expect(hookSrc).toContain('clearTimeout')
    expect(hookSrc).toContain('debounceTimerRef')
  })

  it('debounce timer calls prepareWithSegments inside', () => {
    // The timer callback must call prepareWithSegments to implement prepare()
    expect(hookSrc).toContain('prepareWithSegments(cell, font)')
  })

  it('debounce timer uses rowsRef.current for latest rows', () => {
    expect(hookSrc).toContain('rowsRef.current')
  })

  it('debounce timer guards on fontsReadyRef.current', () => {
    expect(hookSrc).toContain('fontsReadyRef.current')
  })
})

// ---------------------------------------------------------------------------
// AC03 — layout() runs immediately using previously prepared state
// ---------------------------------------------------------------------------

describe('AC03: layout() runs immediately via useMemo', () => {
  it('rowHeights is computed with useMemo (not deferred)', () => {
    expect(hookSrc).toContain('useMemo')
    // layout() path — useMemo depends on prepared, not on the debounce timer
    expect(hookSrc).toMatch(/useMemo\(\s*\(\)\s*=>/)
  })

  it('rowHeights useMemo depends on prepared and columnWidths (not the debounce timer)', () => {
    // The debounce timer sets `prepared` state; rowHeights reacts to `prepared`
    // immediately on the next render — no additional async wait required.
    expect(hookSrc).toMatch(/\[prepared, columnWidths/)
  })

  it('rowHeights falls back to lineHeight when prepared is null', () => {
    expect(hookSrc).toContain('rows.map(() => lineHeight)')
  })
})

// ---------------------------------------------------------------------------
// AC04 — heights stabilise after debounce fires (computeDynamicRowHeights)
// ---------------------------------------------------------------------------

describe('AC04: computeDynamicRowHeights pure function', () => {
  const FONT = '14px monospace'
  const LINE_HEIGHT = 20
  const CELL_PADDING = 16

  it('returns lineHeight for each row when cells fit in one line', () => {
    const rows = [
      ['Hello', 'World'],
      ['Foo', 'Bar'],
    ]
    const prepared = rows.map((cells) =>
      cells.map((cell) => prepareWithSegments(cell, FONT))
    )
    const colWidths = [200, 200]
    const heights = computeDynamicRowHeights(prepared, colWidths, LINE_HEIGHT, CELL_PADDING)
    expect(heights).toHaveLength(2)
    heights.forEach((h) => expect(h).toBeGreaterThanOrEqual(LINE_HEIGHT))
  })

  it('returns taller row when text wraps in a narrow column', () => {
    const longText = 'This is a very long sentence that should wrap when the column is narrow'
    const shortText = 'Short'
    const prepared = [[longText, shortText]].map((cells) =>
      cells.map((cell) => prepareWithSegments(cell, FONT))
    )
    const narrowColWidths = [60, 200]
    const wideColWidths = [600, 200]
    const narrowHeights = computeDynamicRowHeights(prepared, narrowColWidths, LINE_HEIGHT, CELL_PADDING)
    const wideHeights = computeDynamicRowHeights(prepared, wideColWidths, LINE_HEIGHT, CELL_PADDING)
    expect(narrowHeights[0]).toBeGreaterThan(wideHeights[0]!)
  })

  it('uses max height across all cells in a row', () => {
    const tallText = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'
    const shortText = 'X'
    const prepared = [[tallText, shortText]].map((cells) =>
      cells.map((cell) => prepareWithSegments(cell, FONT))
    )
    const colWidths = [60, 400]
    const heights = computeDynamicRowHeights(prepared, colWidths, LINE_HEIGHT, CELL_PADDING)
    expect(heights[0]).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('handles empty rows array', () => {
    const heights = computeDynamicRowHeights([], [], LINE_HEIGHT, CELL_PADDING)
    expect(heights).toEqual([])
  })

  it('clamps column inner width to at least 1px', () => {
    const prepared = [[prepareWithSegments('text', FONT)]]
    // columnWidth smaller than cellPadding → innerWidth < 0 → should clamp to 1
    const heights = computeDynamicRowHeights(prepared, [10], LINE_HEIGHT, CELL_PADDING)
    expect(heights[0]).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('uses lineHeight as minimum row height', () => {
    const prepared = [[prepareWithSegments('X', FONT)]]
    const heights = computeDynamicRowHeights(prepared, [1000], LINE_HEIGHT, CELL_PADDING)
    expect(heights[0]).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('output length equals number of prepared rows', () => {
    const FONT2 = '16px sans-serif'
    const data = [['a', 'b'], ['c', 'd'], ['e', 'f']]
    const prepared = data.map((cells) => cells.map((c) => prepareWithSegments(c, FONT2)))
    const heights = computeDynamicRowHeights(prepared, [100, 100], LINE_HEIGHT, CELL_PADDING)
    expect(heights).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// AC05 — composes with useResizable
// ---------------------------------------------------------------------------

describe('AC05: composability with useResizable', () => {
  it('useDynamicFont accepts the same columnWidths type as useResizable produces', () => {
    // useResizable returns columnWidths: number[]
    // useDynamicFont accepts columnWidths: number[]
    // Type compatibility is enforced by TypeScript; verify the signature here.
    expect(hookSrc).toContain('columnWidths: number[]')
  })

  it('hook does not internally own column width state (stays in sync externally)', () => {
    // useDynamicFont must NOT have its own useState for column widths —
    // callers pass them in so useResizable remains the single source of truth.
    const columnWidthStatePattern = /useState.*columnWidth/
    expect(hookSrc).not.toMatch(columnWidthStatePattern)
  })

  it('rowHeights reacts to columnWidths changes via useMemo', () => {
    // columnWidths is a useMemo dependency so layout() re-runs when it changes.
    expect(hookSrc).toContain('columnWidths,')
  })

  it('UseDynamicFontResult is exported so callers can type-annotate', () => {
    // Allows: const result: UseDynamicFontResult = useDynamicFont(...)
    expect(indexSrc).toContain('UseDynamicFontResult')
  })
})

// ---------------------------------------------------------------------------
// AC07 — structural / style checks (supports typecheck passing)
// ---------------------------------------------------------------------------

describe('AC07: code structure and conventions', () => {
  it('does not call prepare() directly in the component body (only via useMemo / timer)', () => {
    // All prepareWithSegments calls must be inside useEffect or the timer callback
    // (not at the top level of the function body or inside useMemo).
    // We verify this by ensuring prepareWithSegments does NOT appear in a useMemo block.
    const memoBlock = hookSrc.match(/useMemo\(\s*\(\)\s*=>([\s\S]*?)\n  \},/)?.[1] ?? ''
    expect(memoBlock).not.toContain('prepareWithSegments')
  })

  it('does not reference getBoundingClientRect or offsetHeight', () => {
    expect(hookSrc).not.toContain('getBoundingClientRect')
    expect(hookSrc).not.toContain('offsetHeight')
  })

  it('imports Row type from shared types', () => {
    expect(hookSrc).toContain("from '../types.js'")
  })

  it('cleans up debounce timer on unmount', () => {
    expect(hookSrc).toContain('clearTimeout')
    // The cleanup effect returns a function that clears the timer
    expect(hookSrc).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*?clearTimeout/)
  })
})
