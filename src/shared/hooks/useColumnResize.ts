import React, { useCallback, useEffect, useRef, useState } from 'react'

export function useColumnResize(initialWidths: number[]): {
  columnWidths: number[]
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>
  startResize: (colIdx: number, clientX: number) => void
} {
  const [columnWidths, setColumnWidths] = useState<number[]>(initialWidths)

  // We track drag state in a ref (not state) to avoid re-renders during drag;
  // only the final column-width state update triggers a render.
  const dragRef = useRef<{
    colIdx: number
    startX: number
    startWidth: number
  } | null>(null)

  // Cleanup ref: holds the two document listeners so we can remove them on
  // unmount even if a drag is in progress.
  const cleanupRef = useRef<(() => void) | null>(null)

  const startResize = useCallback((colIdx: number, clientX: number) => {
    dragRef.current = {
      colIdx,
      startX: clientX,
      startWidth: columnWidths[colIdx] ?? 0,
    }

    // Suppress text selection while dragging.
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const delta = e.clientX - drag.startX
      const newWidth = Math.max(20, drag.startWidth + delta)
      setColumnWidths(prev => {
        const next = [...prev]
        next[drag.colIdx] = newWidth
        return next
      })
    }

    const onMouseUp = () => {
      dragRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      cleanupRef.current = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    // Store cleanup so unmount can release listeners if drag is still active.
    cleanupRef.current = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [columnWidths])

  // Release any in-progress drag listeners when the component unmounts.
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [])

  return { columnWidths, setColumnWidths, startResize }
}
