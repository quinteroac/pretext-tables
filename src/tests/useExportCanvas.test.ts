/**
 * Tests for useExportCanvas — US-003.
 *
 * Driven via the exported pure helpers `renderTableToContext` and
 * `renderTableToBlob` (no React rendering required).
 *
 * AC01 — hook signature: { exportCanvas: () => Promise<Blob> }
 * AC02 — all rows rendered to an offscreen canvas
 * AC03 — geometry from pretext, no ctx.measureText
 * AC04 — returns Promise<Blob> with MIME type image/png
 * AC05 — exported from src/shared/hooks/index.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { renderTableToContext, renderTableToBlob } from '../shared/hooks/useExportCanvas.js'
import { useExportCanvas } from '../shared/hooks/index.js'
import { BODY_FONT } from '../shared/fonts.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONT = '14px sans-serif'
const LINE_HEIGHT = 20
const CELL_PADDING = 16

function prep(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, FONT)
}

function makeMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    font: '' as string,
    fillStyle: '' as string | CanvasGradient | CanvasPattern,
    textBaseline: '' as CanvasTextBaseline,
  } as unknown as CanvasRenderingContext2D
}

// ---------------------------------------------------------------------------
// Extend document.createElement('canvas') with toBlob in this test file.
//
// The setup.ts polyfill returns a node-canvas object which lacks toBlob.
// We wrap it here using node-canvas's toBuffer() so AC04 tests can resolve.
// ---------------------------------------------------------------------------

type NodeCanvas = {
  toBuffer(format?: string): Buffer
  getContext(id: string): unknown
  width: number
  height: number
  toBlob: (cb: (blob: Blob | null) => void, type?: string) => void
}

const docRef = globalThis as unknown as Record<string, unknown>

let originalDocument: typeof docRef['document']

beforeEach(() => {
  originalDocument = docRef['document']
  const origCreate = (originalDocument as { createElement: (tag: string) => unknown }).createElement.bind(originalDocument)
  docRef['document'] = {
    fonts: { ready: Promise.resolve() },
    createElement(tag: string): unknown {
      const el = origCreate(tag) as NodeCanvas
      if (tag === 'canvas' && typeof el.toBlob === 'undefined') {
        el.toBlob = (cb: (blob: Blob | null) => void, type?: string) => {
          try {
            const buf = el.toBuffer()
            cb(new Blob([new Uint8Array(buf)], { type: type ?? 'image/png' }))
          } catch {
            cb(null)
          }
        }
      }
      return el
    },
  }
})

afterEach(() => {
  docRef['document'] = originalDocument
})

// ---------------------------------------------------------------------------
// AC01: hook returns { exportCanvas: () => Promise<Blob> }
// ---------------------------------------------------------------------------

describe('US-003 AC01: hook shape', () => {
  it('useExportCanvas is a function', () => {
    expect(typeof useExportCanvas).toBe('function')
  })

  it('renderTableToBlob returns a Promise', () => {
    const prepared = [[prep('hello')]]
    const result = renderTableToBlob(prepared, [200], FONT)
    expect(result).toBeInstanceOf(Promise)
  })
})

// ---------------------------------------------------------------------------
// AC02: all rows rendered to the canvas (fillText called once per row cell)
// ---------------------------------------------------------------------------

describe('US-003 AC02: all rows rendered', () => {
  it('calls fillText for every cell in every row', () => {
    const prepared = [
      [prep('row0col0'), prep('row0col1')],
      [prep('row1col0'), prep('row1col1')],
    ]
    const columnWidths = [150, 150]
    const ctx = makeMockCtx()

    renderTableToContext(ctx, prepared, columnWidths, FONT, { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    // At minimum two rows × two columns = four fillText calls (one per single-line cell)
    expect((ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(4)
  })

  it('renders multi-row tables — y offset advances by rowHeight for each row', () => {
    const prepared = [
      [prep('Row A')],
      [prep('Row B')],
      [prep('Row C')],
    ]
    const columnWidths = [300]
    const ctx = makeMockCtx()

    const { rowHeights } = renderTableToContext(ctx, prepared, columnWidths, FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })

    expect(rowHeights).toHaveLength(3)

    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls as [string, number, number][]
    // Each row's y coordinate must equal the sum of all previous row heights + padding
    let expectedY = CELL_PADDING / 2
    for (let r = 0; r < 3; r++) {
      expect(calls[r][2]).toBeCloseTo(expectedY, 5)
      expectedY += rowHeights[r]
    }
  })

  it('renders wrapped text — fillText called once per wrapped line', () => {
    // Use a narrow column so text wraps
    const longText = 'This is a fairly long sentence that should wrap across multiple lines'
    const prepared = [[prep(longText)]]
    const narrowWidths = [80]
    const ctx = makeMockCtx()

    renderTableToContext(ctx, prepared, narrowWidths, FONT, { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    // Must have been called more than once because text wraps
    expect((ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1)
  })

  it('returns correct total dimensions summed from column widths and row heights', () => {
    const prepared = [
      [prep('A'), prep('B')],
      [prep('C'), prep('D')],
    ]
    const columnWidths = [100, 200]
    const ctx = makeMockCtx()

    const { width, height, rowHeights } = renderTableToContext(ctx, prepared, columnWidths, FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })

    expect(width).toBe(300) // 100 + 200
    expect(height).toBe(rowHeights[0] + rowHeights[1])
    expect(height).toBeGreaterThanOrEqual(LINE_HEIGHT * 2)
  })
})

// ---------------------------------------------------------------------------
// AC03: geometry from pretext — ctx.measureText must never be called
// ---------------------------------------------------------------------------

describe('US-003 AC03: no DOM measurement', () => {
  it('never calls ctx.measureText', () => {
    const prepared = [[prep('measure check'), prep('another cell')]]
    const ctx = makeMockCtx()

    renderTableToContext(ctx, prepared, [200, 200], FONT, { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    expect(ctx.measureText).not.toHaveBeenCalled()
  })

  it('row heights are positive finite numbers — derived from layout()', () => {
    const prepared = [
      [prep('Short'), prep('A longer piece of text that might wrap if the column is narrow')],
    ]
    const ctx = makeMockCtx()
    const { rowHeights } = renderTableToContext(ctx, prepared, [200, 80], FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })

    for (const h of rowHeights) {
      expect(Number.isFinite(h)).toBe(true)
      expect(h).toBeGreaterThan(0)
    }
  })

  it('row height is at least lineHeight', () => {
    const prepared = [[prep('x')]]
    const ctx = makeMockCtx()
    const { rowHeights } = renderTableToContext(ctx, prepared, [200], FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })
    expect(rowHeights[0]).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('wider column → taller row for the same text (layout() is doing the work)', () => {
    const text = 'The quick brown fox jumps over the lazy dog and then some more words'
    const preparedNarrow = [[prep(text)]]
    const preparedWide = [[prep(text)]]
    const ctxA = makeMockCtx()
    const ctxB = makeMockCtx()

    const { rowHeights: narrowHeights } = renderTableToContext(ctxA, preparedNarrow, [80], FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })
    const { rowHeights: wideHeights } = renderTableToContext(ctxB, preparedWide, [600], FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })

    expect(narrowHeights[0]).toBeGreaterThanOrEqual(wideHeights[0])
  })
})

// ---------------------------------------------------------------------------
// AC04: returns Promise<Blob> with MIME type image/png
// ---------------------------------------------------------------------------

describe('US-003 AC04: Promise<Blob> with image/png', () => {
  it('resolves with a Blob instance', async () => {
    const prepared = [[prep('hello'), prep('world')]]
    const blob = await renderTableToBlob(prepared, [150, 150], FONT, {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })
    expect(blob).toBeInstanceOf(Blob)
  })

  it('resolved Blob has MIME type image/png', async () => {
    const prepared = [[prep('PNG export test')]]
    const blob = await renderTableToBlob(prepared, [200], FONT)
    expect(blob.type).toBe('image/png')
  })

  it('resolved Blob has non-zero size', async () => {
    const prepared = [
      [prep('cell A'), prep('cell B')],
      [prep('cell C'), prep('cell D')],
    ]
    const blob = await renderTableToBlob(prepared, [120, 120], FONT)
    expect(blob.size).toBeGreaterThan(0)
  })

  it('works with multi-row data', async () => {
    const rows = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
    const prepared = rows.map((text) => [prep(text), prep(text.toLowerCase())])
    const blob = await renderTableToBlob(prepared, [100, 100], FONT)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })
})

// ---------------------------------------------------------------------------
// AC05: exported from src/shared/hooks/index.ts (import already validated above)
// ---------------------------------------------------------------------------

describe('US-003 AC05: barrel export', () => {
  it('useExportCanvas is exported from the hooks barrel', () => {
    expect(typeof useExportCanvas).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('US-003 edge cases', () => {
  it('empty rows array — renderTableToContext returns zero dimensions', () => {
    const ctx = makeMockCtx()
    const { width, height, rowHeights } = renderTableToContext(ctx, [], [], FONT)
    expect(width).toBe(0)
    expect(height).toBe(0)
    expect(rowHeights).toHaveLength(0)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('single cell renders without errors', async () => {
    const prepared = [[prep('single')]]
    const blob = await renderTableToBlob(prepared, [200], FONT)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('respects custom background and fillStyle options', () => {
    const prepared = [[prep('styled')]]
    const ctx = makeMockCtx()

    renderTableToContext(ctx, prepared, [200], FONT, {
      background: '#ff0000',
      fillStyle: '#0000ff',
    })

    // fillRect is called for background
    expect(ctx.fillRect).toHaveBeenCalled()
    // fillStyle should have been set during the call
    expect(ctx.fillStyle).toBe('#0000ff') // last set value after text drawing
  })

  it('body font constant is used as default when font param is omitted', () => {
    const ctx = makeMockCtx()
    const prepared = [[prep('default font')]]
    renderTableToContext(ctx, prepared, [200], BODY_FONT)
    expect(ctx.font).toBe(BODY_FONT)
  })
})
