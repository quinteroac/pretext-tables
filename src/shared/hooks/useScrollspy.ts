import { useEffect, useRef, useState } from 'react'

/**
 * Given a map of { id → boundingClientRect.top }, returns the id whose top
 * is closest to the viewport top (smallest absolute value). Returns null when
 * the map is empty (no sections intersecting).
 */
export function pickNearestSection(intersecting: Map<string, number>): string | null {
  if (intersecting.size === 0) return null

  let nearest: string | null = null
  let nearestAbs = Infinity
  intersecting.forEach((top, id) => {
    const abs = Math.abs(top)
    if (abs < nearestAbs) {
      nearestAbs = abs
      nearest = id
    }
  })
  return nearest
}

/**
 * Tracks which section ID is nearest the top of the viewport using IntersectionObserver.
 * Returns null when no section is intersecting.
 */
export function useScrollspy(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  const intersectingRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (ids.length === 0) return

    const elements = ids.flatMap(id => {
      const el = document.getElementById(id)
      return el ? [el] : []
    })

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const id = entry.target.id
          if (entry.isIntersecting) {
            intersectingRef.current.set(id, entry.boundingClientRect.top)
          } else {
            intersectingRef.current.delete(id)
          }
        })

        setActiveId(pickNearestSection(intersectingRef.current))
      },
      { threshold: [0, 0.1, 0.5, 1] },
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ids])

  return activeId
}
