import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useSpanningCell } from '../../shared/hooks/useSpanningCell.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING, CHART_WIDTH } from './measure.js'
import './spanning-table.css'

export interface SpanningTableProps {
  rows: Row[]
  /** Widths of the two text columns. */
  columnWidths: [number, number]
  /** Width of the spanning chart column in px. Defaults to CHART_WIDTH. */
  chartWidth?: number
  /** Label for the spanning chart column header. */
  chartLabel?: string
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A table with two text columns and a spanning SVG chart column.
 *
 * The chart renders horizontal tick lines and bars pixel-aligned with every
 * row boundary. Heights come from `useMeasure`; offsets come from
 * `useSpanningCell` — no DOM measurement involved.
 */
export function SpanningTable({
  rows,
  columnWidths,
  chartWidth = CHART_WIDTH,
  chartLabel = 'Chart',
  renderCell,
}: SpanningTableProps) {
  const { rowHeights } = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  const { totalHeight, offsets } = useSpanningCell(rowHeights)

  const totalTableWidth = columnWidths[0] + columnWidths[1]

  return (
    <div className="st-root" style={{ '--st-font': BODY_FONT } as React.CSSProperties}>
      <div className="st-table-area" style={{ width: totalTableWidth }}>
        <div className="st-header" style={{ width: totalTableWidth }}>
          {columnWidths.map((w, i) => (
            <div key={i} className="st-th" style={{ width: w, maxWidth: w }}>
              Col {i + 1}
            </div>
          ))}
        </div>
        <div className="st-body" style={{ height: totalHeight, width: totalTableWidth }}>
          {rows.map((row, rowIndex) => (
            <div
              key={row.id}
              className="st-row"
              style={{ top: offsets[rowIndex], height: rowHeights[rowIndex] }}
            >
              {row.cells.slice(0, 2).map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className="st-cell"
                  style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                >
                  {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="st-chart" style={{ width: chartWidth }}>
        <div className="st-chart__header">{chartLabel}</div>
        <svg
          className="st-chart__svg"
          width={chartWidth}
          height={totalHeight}
          aria-label="Row-aligned tick chart"
        >
          {rows.map((_, i) => {
            const y = offsets[i] ?? 0
            const rowH = rowHeights[i] ?? LINE_HEIGHT
            const barW = Math.max(Math.round(((i + 1) / rows.length) * (chartWidth - 12)), 1)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartWidth} y2={y} className="st-tick" />
                <rect
                  x={6}
                  y={y + 4}
                  width={barW}
                  height={Math.max(rowH - 8, 1)}
                  className="st-bar"
                  rx={2}
                />
                <text
                  x={chartWidth - 6}
                  y={y + rowH / 2}
                  className="st-bar-label"
                  dominantBaseline="middle"
                  textAnchor="end"
                >
                  {i + 1}
                </text>
              </g>
            )
          })}
          {rows.length > 0 && (
            <line x1={0} y1={totalHeight} x2={chartWidth} y2={totalHeight} className="st-tick" />
          )}
        </svg>
      </div>
    </div>
  )
}
