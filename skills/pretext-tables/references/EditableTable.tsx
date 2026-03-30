/**
 * Reference implementation: EditableTable
 *
 * Inline-editable cells with per-keystroke row height updates.
 * No DOM measurement at any point.
 *
 * Key pattern:
 *   - prepare() is debounced (~150 ms) to avoid Canvas cost on every keystroke.
 *   - layout() (pure arithmetic) runs synchronously on every input event
 *     against the most recent prepared state for immediate height feedback.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type React from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { useMeasure } from './useMeasure'
import type { Row } from './useMeasure'

const LINE_HEIGHT = 20
const CELL_PADDING = 16
const DEBOUNCE_MS = 150

interface EditableTableProps {
  rows: Row[]
  columnWidths: number[]
  headers?: string[]
  font?: string
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void
}

export function EditableTable({ rows, columnWidths, headers, font = '14px system-ui', onCellChange }: EditableTableProps) {
  // Base heights and prepared grid from the original rows data
  const { rowHeights: baseHeights, prepared: basePrepared } = useMeasure(rows, columnWidths, {
    font, lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING,
  })

  // Per-cell edited text: key = `${rowIndex}_${colIndex}`
  const [editCells, setEditCells] = useState<Map<string, string>>(new Map())
  // Per-cell prepared state after debounce
  const editPreparedRef = useRef<Map<string, PreparedTextWithSegments>>(new Map())
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Reset all edit state when the rows dataset is replaced
  useEffect(() => {
    editPreparedRef.current.clear()
    setEditCells(new Map())
  }, [rows])

  useEffect(() => {
    return () => { debounceTimers.current.forEach(clearTimeout) }
  }, [])

  // layout() pass — runs on every render triggered by editCells change
  const previewHeights = useMemo<number[]>(() => {
    if (!basePrepared || editCells.size === 0) return baseHeights
    return rows.map((row, rowIndex) => {
      let maxHeight = LINE_HEIGHT
      for (let col = 0; col < row.cells.length; col++) {
        const key = `${rowIndex}_${col}`
        const prepared = editCells.has(key)
          ? (editPreparedRef.current.get(key) ?? basePrepared[rowIndex]?.[col])
          : basePrepared[rowIndex]?.[col]
        if (!prepared) continue
        const innerWidth = Math.max((columnWidths[col] ?? 100) - CELL_PADDING, 1)
        const h = layout(prepared, innerWidth, LINE_HEIGHT).height
        if (h > maxHeight) maxHeight = h
      }
      return maxHeight
    })
  }, [basePrepared, baseHeights, editCells, rows, columnWidths])

  const getEditProps = useCallback((rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}_${colIndex}`
    return {
      defaultValue: rows[rowIndex]?.cells[colIndex] ?? '',
      onInput(e: React.FormEvent<HTMLTextAreaElement>) {
        const value = e.currentTarget.value
        // Mark as edited — triggers previewHeights recompute this render
        setEditCells((prev) => new Map(prev).set(key, value))
        // Debounce the expensive prepare() canvas pass
        const existing = debounceTimers.current.get(key)
        if (existing) clearTimeout(existing)
        debounceTimers.current.set(key, setTimeout(() => {
          editPreparedRef.current.set(key, prepareWithSegments(value, font))
          debounceTimers.current.delete(key)
          setEditCells((prev) => new Map(prev)) // nudge re-render
        }, DEBOUNCE_MS))
        onCellChange?.(rowIndex, colIndex, value)
      },
    }
  }, [rows, font, onCellChange])

  return (
    <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      {headers && (
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ width: columnWidths[i], padding: '0 8px' }}>{h}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id} style={{ height: previewHeights[rowIndex] }}>
            {row.cells.map((_cell, colIndex) => (
              <td key={colIndex} style={{ width: columnWidths[colIndex], padding: 0 }}>
                <textarea
                  style={{ width: '100%', height: '100%', resize: 'none', border: 'none', font, padding: '0 8px', boxSizing: 'border-box' }}
                  {...getEditProps(rowIndex, colIndex)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
