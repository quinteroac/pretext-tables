/**
 * Tests for useCanvasCell / createDrawCell — US-004.
 *
 * Uses the exported `createDrawCell` pure helper (no React rendering needed).
 * A mocked CanvasRenderingContext2D verifies that:
 *   - fillText positions match layoutWithLines() output (AC01, AC06)
 *   - ctx.measureText is never called (AC02)
 *   - null prepared is handled gracefully (AC03)
 *   - visual effects are applied (AC04)
 *   - dpr scaling calls ctx.scale(dpr, dpr) (AC05)
 */
import { describe, it, expect, vi } from 'vitest'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { createDrawCell } from '../shared/hooks/useCanvasCell.js'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    font: '' as string,
    fillStyle: '' as string,
    textBaseline: '' as string,
    shadowColor: '' as string,
    shadowBlur: 0 as number,
    shadowOffsetX: 0 as number,
    shadowOffsetY: 0 as number,
  } as unknown as CanvasRenderingContext2D
}

const FONT = '14px sans-serif'
const LINE_HEIGHT = 20
const CELL_PADDING = 8
const COL_WIDTH = 200

// ---------------------------------------------------------------------------
// AC01 + AC06: fillText positions match layoutWithLines output
// ---------------------------------------------------------------------------

describe('US-004 AC01+AC06: fillText positions match layoutWithLines', () => {
  it('calls fillText for a single-line cell with correct x and y', () => {
    const text = 'Hello'
    const prepared = [[prepareWithSegments(text, FONT)]]
    const columnWidths = [COL_WIDTH]
    const drawCell = createDrawCell(prepared, columnWidths, { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })
    const ctx = makeMockCtx()
    const x = 10
    const y = 5

    drawCell(ctx, 0, 0, x, y, 1)

    const innerWidth = Math.max(COL_WIDTH - CELL_PADDING * 2, 1)
    const result = layoutWithLines(prepared[0][0], innerWidth, LINE_HEIGHT)

    expect(ctx.fillText).toHaveBeenCalledTimes(result.lines.length)
    for (let i = 0; i < result.lines.length; i++) {
      expect(ctx.fillText).toHaveBeenNthCalledWith(
        i + 1,
        result.lines[i].text,
        x + CELL_PADDING,
        y + CELL_PADDING + i * LINE_HEIGHT
      )
    }
  })

  it('calls fillText for each wrapped line with y offset = lineIndex * lineHeight', () => {
    const longText = 'This is a long sentence that must wrap across multiple lines inside the cell'
    const narrowWidths = [80]
    const prepared = [[prepareWithSegments(longText, FONT)]]
    const drawCell = createDrawCell(prepared, narrowWidths, { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })
    const ctx = makeMockCtx()

    drawCell(ctx, 0, 0, 0, 0, 1)

    const innerWidth = Math.max(narrowWidths[0] - CELL_PADDING * 2, 1)
    const result = layoutWithLines(prepared[0][0], innerWidth, LINE_HEIGHT)

    expect(result.lines.length).toBeGreaterThan(1)
    expect(ctx.fillText).toHaveBeenCalledTimes(result.lines.length)

    for (let i = 0; i < result.lines.length; i++) {
      const [, , expectedY] = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls[i] as [string, number, number]
      expect(expectedY).toBe(CELL_PADDING + i * LINE_HEIGHT)
    }
  })

  it('accesses the correct prepared cell by rowIndex and colIndex', () => {
    const prepared = [
      [prepareWithSegments('r0c0', FONT), prepareWithSegments('r0c1', FONT)],
      [prepareWithSegments('r1c0', FONT), prepareWithSegments('r1c1', FONT)],
    ]
    const columnWidths = [100, 150]
    const drawCell = createDrawCell(prepared, columnWidths, { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })
    const ctx = makeMockCtx()

    drawCell(ctx, 1, 1, 0, 0, 1)

    const innerWidth = Math.max(150 - CELL_PADDING * 2, 1)
    const result = layoutWithLines(prepared[1][1], innerWidth, LINE_HEIGHT)

    expect(ctx.fillText).toHaveBeenCalledWith(result.lines[0].text, CELL_PADDING, CELL_PADDING)
  })
})

// ---------------------------------------------------------------------------
// AC02: ctx.measureText must never be called
// ---------------------------------------------------------------------------

describe('US-004 AC02: no ctx.measureText', () => {
  it('never calls ctx.measureText', () => {
    const prepared = [[prepareWithSegments('test text', FONT)]]
    const ctx = makeMockCtx() as unknown as Record<string, unknown> & CanvasRenderingContext2D
    const measureTextMock = vi.fn()
    ctx.measureText = measureTextMock

    const drawCell = createDrawCell(prepared, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })
    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(measureTextMock).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC03: prepared is consumed, not produced — null guard
// ---------------------------------------------------------------------------

describe('US-004 AC03: prepared is passed in, not generated', () => {
  it('returns early and draws nothing when prepared is null', () => {
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(null, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.fillText).not.toHaveBeenCalled()
    expect(ctx.save).not.toHaveBeenCalled()
  })

  it('returns early when rowIndex is out of bounds', () => {
    const prepared = [[prepareWithSegments('data', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    drawCell(ctx, 99, 0, 0, 0, 1)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC04: visual effects
// ---------------------------------------------------------------------------

describe('US-004 AC04: visual effects', () => {
  it('gradient — creates a LinearGradient and sets fill colors', () => {
    const mockGrad = { addColorStop: vi.fn() }
    const ctx = {
      ...makeMockCtx(),
      createLinearGradient: vi.fn(() => mockGrad),
    } as unknown as CanvasRenderingContext2D

    const prepared = [[prepareWithSegments('gradient text', FONT)]]
    const drawCell = createDrawCell(prepared, [COL_WIDTH], {
      font: FONT,
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
      effect: { type: 'gradient', startColor: '#ff0000', endColor: '#0000ff' },
    })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.createLinearGradient).toHaveBeenCalled()
    expect(mockGrad.addColorStop).toHaveBeenCalledWith(0, '#ff0000')
    expect(mockGrad.addColorStop).toHaveBeenCalledWith(1, '#0000ff')
  })

  it('shadow — sets shadowColor and shadowBlur on context', () => {
    const prepared = [[prepareWithSegments('shadow text', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], {
      font: FONT,
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
      effect: { type: 'shadow', color: 'rgba(0,0,0,0.5)', blur: 6, offsetX: 1, offsetY: 2 },
    })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.shadowColor).toBe('rgba(0,0,0,0.5)')
    expect(ctx.shadowBlur).toBe(6)
    expect(ctx.shadowOffsetX).toBe(1)
    expect(ctx.shadowOffsetY).toBe(2)
  })

  it('shadow — uses defaults when color/blur/offsets are omitted', () => {
    const prepared = [[prepareWithSegments('shadow defaults', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], {
      font: FONT,
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
      effect: { type: 'shadow' },
    })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.shadowColor).toBe('rgba(0,0,0,0.3)')
    expect(ctx.shadowBlur).toBe(4)
    expect(ctx.shadowOffsetX).toBe(0)
    expect(ctx.shadowOffsetY).toBe(1)
  })

  it('fadeTruncation — draws gradient rect overlay after fillText', () => {
    const mockGrad = { addColorStop: vi.fn() }
    const ctx = {
      ...makeMockCtx(),
      createLinearGradient: vi.fn(() => mockGrad),
    } as unknown as CanvasRenderingContext2D

    const prepared = [[prepareWithSegments('fade truncation text', FONT)]]
    const drawCell = createDrawCell(prepared, [COL_WIDTH], {
      font: FONT,
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
      effect: { type: 'fadeTruncation', fadeWidth: 40 },
    })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.fillText).toHaveBeenCalled()
    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.createLinearGradient).toHaveBeenCalled()
    // Verify fade overlay width matches fadeWidth
    const fillRectCall = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls[0] as number[]
    expect(fillRectCall[2]).toBe(40)
  })

  it('fadeTruncation — uses default fadeFrom/fadeTo colors when omitted', () => {
    const mockGrad = { addColorStop: vi.fn() }
    const ctx = {
      ...makeMockCtx(),
      createLinearGradient: vi.fn(() => mockGrad),
    } as unknown as CanvasRenderingContext2D

    const prepared = [[prepareWithSegments('fade defaults', FONT)]]
    const drawCell = createDrawCell(prepared, [COL_WIDTH], {
      font: FONT,
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
      effect: { type: 'fadeTruncation' },
    })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(mockGrad.addColorStop).toHaveBeenCalledWith(0, 'rgba(255,255,255,0)')
    expect(mockGrad.addColorStop).toHaveBeenCalledWith(1, 'rgba(255,255,255,1)')
  })
})

// ---------------------------------------------------------------------------
// AC05: HiDPI / dpr scaling
// ---------------------------------------------------------------------------

describe('US-004 AC05: HiDPI / dpr scaling', () => {
  it('calls ctx.scale(dpr, dpr) when dpr is 2', () => {
    const prepared = [[prepareWithSegments('hi-dpi', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    drawCell(ctx, 0, 0, 0, 0, 2)

    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
  })

  it('does not call ctx.scale when dpr is 1', () => {
    const prepared = [[prepareWithSegments('no scale', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.scale).not.toHaveBeenCalled()
  })

  it('wraps drawing in ctx.save() / ctx.restore()', () => {
    const prepared = [[prepareWithSegments('save restore', FONT)]]
    const ctx = makeMockCtx()
    const drawCell = createDrawCell(prepared, [COL_WIDTH], { font: FONT, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

    drawCell(ctx, 0, 0, 0, 0, 1)

    expect(ctx.save).toHaveBeenCalledOnce()
    expect(ctx.restore).toHaveBeenCalledOnce()
  })
})
