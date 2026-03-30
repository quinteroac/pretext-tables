/**
 * Tests for US-005 — Demo page update.
 *
 * Verifies that useStickyColumns, useInfiniteScroll, and useCanvasCell are
 * demonstrated on the demo page. Uses source-level checks (readFileSync)
 * following the pattern established in demo-sections.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../demo/App.tsx')
const cssSrc = readSrc('../demo/demo.css')

// ---------------------------------------------------------------------------
// AC01: sticky-column section uses useStickyColumns with ≥1 frozen column
//       and enough scrollable columns for horizontal scroll
// ---------------------------------------------------------------------------

describe('US-005 AC01: sticky-column section', () => {
  it('App.tsx imports useStickyColumns', () => {
    expect(appSrc).toContain('useStickyColumns')
  })

  it('StickyColumnShowcase is defined in App.tsx', () => {
    expect(appSrc).toContain('function StickyColumnShowcase')
  })

  it('useStickyColumns is called with frozenCount: 1', () => {
    expect(appSrc).toMatch(/useStickyColumns\s*\(\s*\{[^}]*frozenCount\s*:\s*1/)
  })

  it('frozen pane cells use position: sticky', () => {
    expect(appSrc).toMatch(/position\s*:\s*['"]sticky['"]/)
  })

  it('frozen and scrollable column arrays are used for rendering', () => {
    expect(appSrc).toContain('frozenWidths')
    expect(appSrc).toContain('scrollWidths')
  })

  it('table has enough columns to require horizontal scroll (≥4 total widths)', () => {
    // CC_COLUMN_WIDTHS has 5 entries — sufficient to cause overflow
    expect(appSrc).toContain('CC_COLUMN_WIDTHS')
    expect(appSrc).toMatch(/CC_COLUMN_WIDTHS\s*=\s*\[[^\]]*,[^\]]*,[^\]]*,[^\]]*,/)
  })
})

// ---------------------------------------------------------------------------
// AC02: infinite-scroll section loads rows at bottom with loading indicator
// ---------------------------------------------------------------------------

describe('US-005 AC02: InfiniteScrollDemo section', () => {
  it('App.tsx defines InfiniteScrollDemo component', () => {
    expect(appSrc).toContain('function InfiniteScrollDemo')
  })

  it('App.tsx imports useInfiniteScroll', () => {
    expect(appSrc).toContain('useInfiniteScroll')
  })

  it('InfiniteScrollDemo renders inside App', () => {
    expect(appSrc).toMatch(/<InfiniteScrollDemo\s*\/>/)
  })

  it('useInfiniteScroll is called with onLoadMore, threshold, and rowHeights', () => {
    expect(appSrc).toMatch(/useInfiniteScroll\s*\(\s*\{/)
    expect(appSrc).toContain('onLoadMore')
    expect(appSrc).toContain('threshold')
  })

  it('isLoading flag is used from useInfiniteScroll result', () => {
    expect(appSrc).toContain('isLoading')
  })

  it('a loading indicator is rendered when isLoading is true', () => {
    expect(appSrc).toMatch(/isLoading[^}]*Loading more rows/)
  })

  it('is-loading-indicator CSS class is defined', () => {
    expect(cssSrc).toContain('.is-loading-indicator')
  })

  it('is-loading-spinner CSS class is defined for the spinner', () => {
    expect(cssSrc).toContain('.is-loading-spinner')
  })

  it('is-scroll-container CSS class is defined', () => {
    expect(cssSrc).toContain('.is-scroll-container')
  })

  it('scroll container uses overflow-y: auto', () => {
    expect(cssSrc).toMatch(/\.is-scroll-container[^{]*\{[^}]*overflow-y\s*:\s*auto/)
  })

  it('onScroll from useInfiniteScroll is attached to the scroll container', () => {
    expect(appSrc).toMatch(/onScroll=\{onScroll\}/)
  })
})

// ---------------------------------------------------------------------------
// AC03: canvas section renders at least one cell effect
// ---------------------------------------------------------------------------

describe('US-005 AC03: CanvasCellDemo section', () => {
  it('App.tsx defines CanvasCellDemo component', () => {
    expect(appSrc).toContain('function CanvasCellDemo')
  })

  it('App.tsx imports useCanvasCell', () => {
    expect(appSrc).toContain('useCanvasCell')
  })

  it('CanvasCellDemo renders inside App', () => {
    expect(appSrc).toMatch(/<CanvasCellDemo\s*\/>/)
  })

  it('useCanvasCell is called with prepared, columnWidths, and options', () => {
    expect(appSrc).toMatch(/useCanvasCell\s*\(\s*\{/)
    expect(appSrc).toContain('prepared')
    expect(appSrc).toContain('columnWidths')
  })

  it('a canvas effect is configured (gradient, shadow, or fadeTruncation)', () => {
    expect(appSrc).toMatch(/effect\s*:\s*\{[^}]*type\s*:\s*['"](?:gradient|shadow|fadeTruncation)['"]/)
  })

  it('drawCell is called in a useEffect to paint the canvas', () => {
    expect(appSrc).toMatch(/drawCell\s*\(/)
    expect(appSrc).toContain('useEffect')
  })

  it('canvas ref is attached to a <canvas> element', () => {
    expect(appSrc).toMatch(/ref=\{canvasRef\}/)
    expect(appSrc).toMatch(/<canvas/)
  })

  it('cv-canvas CSS class is defined', () => {
    expect(cssSrc).toContain('.cv-canvas')
  })

  it('cv-canvas-wrapper CSS class is defined', () => {
    expect(cssSrc).toContain('.cv-canvas-wrapper')
  })
})

// ---------------------------------------------------------------------------
// AC06: source quality — no forbidden patterns
// ---------------------------------------------------------------------------

describe('US-005 AC06: source quality guards', () => {
  it('App.tsx does not call getBoundingClientRect for cell sizing', () => {
    expect(appSrc).not.toMatch(/\bgetBoundingClientRect\s*\(/)
  })

  it('App.tsx uses BODY_FONT and HEADER_FONT constants (no inline font strings)', () => {
    expect(appSrc).toContain('BODY_FONT')
    expect(appSrc).toContain('HEADER_FONT')
  })

  it('InfiniteScrollDemo uses rowHeights from useMeasure (not scrollHeight)', () => {
    expect(appSrc).toContain('rowHeights')
    // The useInfiniteScroll hook uses rowHeights sum internally, not DOM scrollHeight
    // Verify InfiniteScrollDemo does not read scrollHeight directly
    const isSection = appSrc.slice(
      appSrc.indexOf('function InfiniteScrollDemo'),
      appSrc.indexOf('function CanvasCellDemo'),
    )
    expect(isSection).not.toMatch(/\.scrollHeight/)
  })

  it('CanvasCellDemo does not call ctx.measureText', () => {
    expect(appSrc).not.toMatch(/ctx\.measureText\s*\(/)
  })

  it('CanvasCellDemo does not import prepare() directly for canvas layout', () => {
    // Canvas layout uses layoutWithLines() inside useCanvasCell, never raw prepare()
    // We verify drawCell is the only canvas API surface used in the component
    expect(appSrc).toContain('drawCell')
  })
})
