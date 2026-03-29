import { useEffect, useRef } from 'react'

export interface ExpandableOptions {
  /**
   * Fired whenever the observed element's content box changes size.
   * prevWidth / prevHeight are the dimensions from the previous measurement.
   * Use this to e.g. scale column widths proportionally.
   */
  onResize?: (
    width: number,
    height: number,
    prevWidth: number,
    prevHeight: number
  ) => void
}

/**
 * Observes an element's size with ResizeObserver and fires onResize on every
 * change. The returned ref must be attached to the element you want to track.
 *
 * The callback is stored in a ref internally so callers never need to
 * stabilise it with useCallback — a plain inline function works fine.
 */
export function useExpandable(options?: ExpandableOptions) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef<{ width: number; height: number } | null>(null)

  // Keep a ref to the latest callback so the ResizeObserver never sees a stale
  // closure, without needing to re-create the observer on every render.
  const onResizeCb = useRef(options?.onResize)
  useEffect(() => {
    onResizeCb.current = options?.onResize
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (prev.current === null) {
        prev.current = { width, height }
        return
      }
      onResizeCb.current?.(width, height, prev.current.width, prev.current.height)
      prev.current = { width, height }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // intentionally empty — el is stable after mount

  return ref
}
