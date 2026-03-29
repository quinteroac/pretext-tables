/**
 * US-003: Multi-line text wrap in fixed-width columns
 *
 * These tests verify that:
 * 1. A cell with text that wraps to N lines gets height = N * LINE_HEIGHT
 * 2. Cells respect column width boundaries (text does not exceed the given width)
 */
import { describe, it, expect } from 'vitest'
import { layout, prepareWithSegments } from '@chenglou/pretext'
import { measureCellHeight, measureRowHeights, LINE_HEIGHT } from '../tables/basic-table/measure.js'
import { BODY_FONT } from '../shared/fonts.js'
import type { Column, TableRow } from '../shared/types.js'

// ---------------------------------------------------------------------------
// Height = lineCount * LINE_HEIGHT
// ---------------------------------------------------------------------------

describe('US-003: wrapped cell height equals lineCount * LINE_HEIGHT', () => {
  it('single-line text yields exactly LINE_HEIGHT', () => {
    const prepared = prepareWithSegments('Hi', BODY_FONT)
    const result = layout(prepared, 400, LINE_HEIGHT)

    expect(result.lineCount).toBe(1)
    expect(result.height).toBe(1 * LINE_HEIGHT)
    expect(measureCellHeight('Hi', 400)).toBe(result.height)
  })

  it('text that wraps to multiple lines yields lineCount * LINE_HEIGHT', () => {
    const text =
      'This is a deliberately long sentence that must wrap across multiple lines when rendered in a narrow column.'
    const narrowWidth = 80

    const prepared = prepareWithSegments(text, BODY_FONT)
    const result = layout(prepared, narrowWidth, LINE_HEIGHT)

    expect(result.lineCount).toBeGreaterThan(1)
    expect(result.height).toBe(result.lineCount * LINE_HEIGHT)
    expect(measureCellHeight(text, narrowWidth)).toBe(result.height)
  })

  it('height scales linearly with line count across different widths', () => {
    const text =
      'Word wrap test: the narrower the column the more lines are needed to display the same text.'

    const widths = [40, 80, 160, 320]
    const heights = widths.map((w) => {
      const prepared = prepareWithSegments(text, BODY_FONT)
      return layout(prepared, w, LINE_HEIGHT)
    })

    for (const { height, lineCount } of heights) {
      expect(height).toBe(lineCount * LINE_HEIGHT)
      expect(height % LINE_HEIGHT).toBe(0)
    }

    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]!.height).toBeLessThanOrEqual(heights[i - 1]!.height)
    }
  })

  it('measureRowHeights returns max(cell heights) and each is a multiple of LINE_HEIGHT', () => {
    const longText =
      'A very long piece of text that wraps many times in a narrow column so the row grows tall.'
    const shortText = 'Short'
    const narrowWidth = 60
    const wideWidth = 400

    const columns: Column[] = [
      { key: 'a', header: 'A', width: narrowWidth },
      { key: 'b', header: 'B', width: wideWidth },
    ]
    const rows: TableRow[] = [{ id: 'r1', a: longText, b: shortText }]

    const [rowHeight] = measureRowHeights(rows, columns)

    expect(rowHeight! % LINE_HEIGHT).toBe(0)
    expect(rowHeight!).toBeGreaterThanOrEqual(LINE_HEIGHT)

    const tallHeight = measureCellHeight(longText, narrowWidth)
    const shortHeight = measureCellHeight(shortText, wideWidth)
    expect(rowHeight!).toBe(Math.max(tallHeight, shortHeight, LINE_HEIGHT))
  })
})

// ---------------------------------------------------------------------------
// Column width boundaries: text must not exceed the given width
// ---------------------------------------------------------------------------

describe('US-003: text respects column width boundaries', () => {
  it('no line in the layout exceeds the specified column width', () => {
    const text =
      'Superlongwordthatmightcauseoverflowifnothandledproperly and also some normal words after it.'
    const columnWidth = 100

    const prepared = prepareWithSegments(text, BODY_FONT)
    const result = layout(prepared, columnWidth, LINE_HEIGHT)
    expect(result.height).toBeGreaterThan(0)
    expect(result.height % LINE_HEIGHT).toBe(0)
  })

  it('a wider column yields fewer or equal lines than a narrower column', () => {
    const text =
      'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.'

    const narrowResult = layout(prepareWithSegments(text, BODY_FONT), 80, LINE_HEIGHT)
    const wideResult = layout(prepareWithSegments(text, BODY_FONT), 300, LINE_HEIGHT)

    expect(wideResult.lineCount).toBeLessThanOrEqual(narrowResult.lineCount)
    expect(wideResult.height).toBeLessThanOrEqual(narrowResult.height)
  })

  it('measureRowHeights respects each column width independently', () => {
    const text =
      'This text will wrap differently depending on the column width assigned to it during measurement.'

    const rows: TableRow[] = [
      { id: 'r1', a: text },
      { id: 'r2', a: text },
    ]

    const narrowColumns: Column[] = [{ key: 'a', header: 'A', width: 80 }]
    const wideColumns: Column[] = [{ key: 'a', header: 'A', width: 400 }]

    const narrowHeights = measureRowHeights(rows, narrowColumns)
    const wideHeights = measureRowHeights(rows, wideColumns)

    expect(narrowHeights[0]!).toBeGreaterThan(wideHeights[0]!)
    expect(narrowHeights[1]!).toBeGreaterThan(wideHeights[1]!)
    expect(narrowHeights[0]!).toBe(narrowHeights[1]!)
    expect(wideHeights[0]!).toBe(wideHeights[1]!)
  })
})
