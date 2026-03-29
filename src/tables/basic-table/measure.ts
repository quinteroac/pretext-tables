import { prepareWithSegments, layout } from '@chenglou/pretext'
import { BODY_FONT } from '../../shared/fonts.js'
import type { Row } from '../../shared/types.js'

export const LINE_HEIGHT = 20

/**
 * Measure the height of a single cell given its text content and column width.
 * Must only be called after document.fonts.ready has resolved.
 */
export function measureCellHeight(text: string, columnWidth: number): number {
  const prepared = prepareWithSegments(text, BODY_FONT)
  const result = layout(prepared, columnWidth, LINE_HEIGHT)
  return result.height
}

/**
 * Compute the height of every row by measuring each cell and taking the max
 * across all cells in that row.
 *
 * @param rows        - Array of row data
 * @param columnWidths - Width in px for each column
 * @returns           - Array of row heights (one entry per row)
 */
export function measureRowHeights(rows: Row[], columnWidths: number[]): number[] {
  return rows.map((row) => {
    let maxHeight = LINE_HEIGHT
    for (let col = 0; col < row.cells.length; col++) {
      const width = columnWidths[col] ?? 100
      const h = measureCellHeight(row.cells[col] ?? '', width)
      if (h > maxHeight) maxHeight = h
    }
    return maxHeight
  })
}
