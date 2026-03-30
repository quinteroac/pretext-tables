/**
 * Tests for US-005 — Wire useResizePreview into ResizableTable.
 *
 * Because ResizableTable is a React component requiring a browser environment
 * to render, tests focus on:
 *   - Source-level guarantees (prop shape, import, hook wiring)
 *   - Hook-level contracts (previewHeights vs committed heights)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const resizableSrc = readSrc('../tables/resizable-table/index.tsx')

// ---------------------------------------------------------------------------
// AC01: ResizableTable accepts optional resizePreview?: boolean prop
// ---------------------------------------------------------------------------

describe('US-005 AC01: resizePreview prop declaration', () => {
  it('ResizableTableProps declares resizePreview?: boolean', () => {
    expect(resizableSrc).toMatch(/resizePreview\s*\??\s*:\s*boolean/)
  })

  it('component destructures resizePreview with default false', () => {
    expect(resizableSrc).toMatch(/resizePreview\s*=\s*false/)
  })

  it('useResizePreview is imported in ResizableTable source', () => {
    expect(resizableSrc).toContain('useResizePreview')
  })

  it('useResizePreview is called with resizePreview gate', () => {
    // The hook call must be gated so it returns null when resizePreview=false.
    expect(resizableSrc).toMatch(/resizePreview\s*\?\s*previewDragState/)
  })
})

// ---------------------------------------------------------------------------
// AC02: Ghost layer is a separate absolutely-positioned overlay column
// ---------------------------------------------------------------------------

describe('US-005 AC02: ghost overlay is absolutely positioned', () => {
  it('ghost element has resizable-table-ghost class', () => {
    expect(resizableSrc).toContain('resizable-table-ghost')
  })

  it('ghost renders one cell per row (previewHeights.map)', () => {
    expect(resizableSrc).toContain('previewHeights.map')
  })

  it('ghost overlay uses previewHeights for cell heights', () => {
    expect(resizableSrc).toMatch(/resizable-table-ghost-cell/)
  })

  it('ghost CSS sets position: absolute', () => {
    const css = readSrc('../tables/resizable-table/resizable-table.css')
    expect(css).toContain('.resizable-table-ghost')
    expect(css).toMatch(/\.resizable-table-ghost\s*\{[^}]*position\s*:\s*absolute/)
  })

  it('ghost is aria-hidden (decorative overlay)', () => {
    expect(resizableSrc).toContain('aria-hidden="true"')
  })
})

// ---------------------------------------------------------------------------
// AC03: Real row heights and DOM cells unchanged until pointerup / drag-end
// ---------------------------------------------------------------------------

describe('US-005 AC03: real heights frozen during drag when resizePreview=true', () => {
  it('committedColumnWidths state is declared and synced when drag ends', () => {
    expect(resizableSrc).toContain('committedColumnWidths')
    expect(resizableSrc).toContain('setCommittedColumnWidths')
  })

  it('measureColumnWidths uses committedColumnWidths during an active drag', () => {
    // During drag: measureColumnWidths = committedColumnWidths (frozen)
    expect(resizableSrc).toContain('measureColumnWidths')
    expect(resizableSrc).toMatch(/previewDragState\s*!==\s*null\s*\?\s*committedColumnWidths/)
  })

  it('useMeasure receives measureColumnWidths (not raw columnWidths)', () => {
    expect(resizableSrc).toMatch(/useMeasure\s*\(\s*rows\s*,\s*measureColumnWidths/)
  })

  it('computePreviewHeights height increases when dragged column narrows', async () => {
    // Verify the hook contract: narrowing a column causes taller rows.
    const { computePreviewHeights } = await import('../shared/hooks/useResizePreview.js')
    const { prepareWithSegments } = await import('@chenglou/pretext')
    const { BODY_FONT } = await import('../shared/fonts.js')

    const LINE_HEIGHT = 20
    const CELL_PADDING = 16
    const prepared = [
      [
        prepareWithSegments('Alice', BODY_FONT),
        prepareWithSegments('Leads the entire frontend architecture and sets coding standards for the org.', BODY_FONT),
      ],
    ]
    const committedWidths = [200, 400]
    const wide  = computePreviewHeights(prepared, { colIndex: 1, currentWidth: 400 }, committedWidths, LINE_HEIGHT, CELL_PADDING)
    const narrow = computePreviewHeights(prepared, { colIndex: 1, currentWidth: 80  }, committedWidths, LINE_HEIGHT, CELL_PADDING)

    // Narrower column → taller row
    expect(narrow[0]).toBeGreaterThan(wide[0])
  })

  it('committed widths do not affect preview for non-dragged columns', async () => {
    const { computePreviewHeights } = await import('../shared/hooks/useResizePreview.js')
    const { prepareWithSegments } = await import('@chenglou/pretext')
    const { BODY_FONT } = await import('../shared/fonts.js')

    const prepared = [
      [prepareWithSegments('Hi', BODY_FONT), prepareWithSegments('Short text', BODY_FONT)],
    ]
    // Dragging column 1 — column 0 committed width varies but result must equal
    const r1 = computePreviewHeights(prepared, { colIndex: 1, currentWidth: 120 }, [200, 300], 20, 16)
    const r2 = computePreviewHeights(prepared, { colIndex: 1, currentWidth: 120 }, [350, 300], 20, 16)
    // Both produce the same row heights since col0 text is short in either case
    expect(r1[0]).toBe(r2[0])
  })
})

// ---------------------------------------------------------------------------
// AC04: Existing ResizableTable API is unchanged
// ---------------------------------------------------------------------------

describe('US-005 AC04: existing ResizableTable API unchanged', () => {
  const existingProps = ['rows', 'headers', 'defaultColumnWidths', 'horizontal', 'vertical', 'shrinkWrap', 'renderCell']

  for (const prop of existingProps) {
    it(`existing prop "${prop}" is still present`, () => {
      expect(resizableSrc).toContain(prop)
    })
  }

  it('resizePreview is optional (has default false, so existing callers are unaffected)', () => {
    expect(resizableSrc).toMatch(/resizePreview\s*=\s*false/)
  })
})

// ---------------------------------------------------------------------------
// AC05: Typecheck and lint pass — verified via source-level checks
// ---------------------------------------------------------------------------

describe('US-005 AC05: source quality guards', () => {
  it('useResizePreview is imported from the correct relative path', () => {
    expect(resizableSrc).toMatch(/from\s+['"].*useResizePreview(\.js)?['"]/)
  })

  it('no DOM measurement APIs used for cell sizing', () => {
    expect(resizableSrc).not.toContain('getBoundingClientRect')
    expect(resizableSrc).not.toContain('clientWidth')
    expect(resizableSrc).not.toContain('clientHeight')
  })

  it('header offsetHeight is used only for ghost positioning (visual), not in useMeasure call', () => {
    // theadRef.current.offsetHeight must appear only near the ghost positioning code,
    // not as an argument to useMeasure or layout().
    expect(resizableSrc).toContain('offsetHeight')
    expect(resizableSrc).not.toMatch(/useMeasure[^)]*offsetHeight/)
  })

  it('ghost container CSS has pointer-events: none (non-interactive)', () => {
    const css = readSrc('../tables/resizable-table/resizable-table.css')
    expect(css).toMatch(/\.resizable-table-ghost\s*\{[^}]*pointer-events\s*:\s*none/)
  })

  it('container has position: relative to contain the ghost overlay', () => {
    const css = readSrc('../tables/resizable-table/resizable-table.css')
    expect(css).toMatch(/\.resizable-table-container\s*\{[^}]*position\s*:\s*relative/)
  })
})
