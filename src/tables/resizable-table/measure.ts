// All prepare() and layout() calls live here — never in the component render function.
// prepare() uses the Canvas font engine (~19 ms / 500 texts) and must be called once per
// unique (text, font) pair. layout() is pure arithmetic and safe to call during render.

import { prepare, layout, type PreparedText } from '@chenglou/pretext'
import type { Column, TableRow } from '../../shared/types'

/**
 * Prepare every cell in the table data set for a given font.
 * Returns a 2D array: preparedCells[rowIndex][colIndex].
 *
 * Call this once when rows/columns change — never inside a render loop.
 * Coerces undefined/null values to empty string for robustness.
 */
export function prepareRows(
  rows: TableRow[],
  columns: Column[],
  font: string
): PreparedText[][] {
  return rows.map(row =>
    columns.map(col => {
      // Coerce null/undefined to empty string so prepare() never receives bad input.
      const rawValue = row[col.key]
      const text: string =
        rawValue == null ? '' : String(rawValue)
      return prepare(text, font)
    })
  )
}

/**
 * Derive the display height for each row.
 * Each cell is laid out at its column width; the tallest cell in the row determines row height.
 * A minimum height is enforced so empty rows still have a visible slot.
 *
 * layout() is pure arithmetic — safe to call per-render if column widths change.
 */
export function computeRowHeights(
  preparedCells: PreparedText[][],
  columnWidths: number[],
  lineHeight: number,
  minHeight: number = lineHeight + 24 // top + bottom cell padding
): number[] {
  return preparedCells.map(rowCells => {
    let maxHeight = minHeight
    rowCells.forEach((cell, colIdx) => {
      const width = columnWidths[colIdx] ?? 0
      if (width <= 0) return
      const { height } = layout(cell, width, lineHeight)
      // Add vertical cell padding (12px top + 12px bottom) to the text block height.
      const totalCellHeight = height + 24
      if (totalCellHeight > maxHeight) maxHeight = totalCellHeight
    })
    return maxHeight
  })
}
