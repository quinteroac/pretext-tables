import { useState, useEffect } from 'react'

/**
 * Returns true once document.fonts.ready has resolved.
 * Measuring text before fonts load silently falls back to a system font,
 * producing wrong widths. Always wait for this before calling prepare().
 */
export function useFontsReady(): boolean {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => { cancelled = true }
  }, [])
  return fontsReady
}
