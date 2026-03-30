import { useMemo } from 'react'
import { computeOffsets, computeTotalHeight } from './useVirtualization.js'

export interface UseSpanningCellResult {
  /** Sum of all row heights — use as the height of the spanning side column. */
  totalHeight: number
  /**
   * Cumulative top offset for each row.
   * offsets[i] = sum of rowHeights[0..i-1].
   * Use offsets[i] as the Y position of the top of row i in the spanning column.
   */
  offsets: number[]
}

/**
 * Derives `totalHeight` and `offsets[]` from pretext-measured `rowHeights`.
 *
 * Use these to render a side column (chart, visualisation, etc.) that is
 * pixel-aligned with every row — no DOM measurement required.
 *
 * This is a thin wrapper over `computeTotalHeight` / `computeOffsets` from
 * `useVirtualization`; no new measurement logic is introduced.
 */
export function useSpanningCell(rowHeights: number[]): UseSpanningCellResult {
  const totalHeight = useMemo(() => computeTotalHeight(rowHeights), [rowHeights])
  const offsets = useMemo(() => computeOffsets(rowHeights), [rowHeights])
  return { totalHeight, offsets }
}
