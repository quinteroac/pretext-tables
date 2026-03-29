/**
 * Vitest global setup.
 *
 * @chenglou/pretext needs a Canvas 2D context for text measurement.
 * In a Node.js test environment there is no DOM, so we polyfill
 * `document.createElement` (canvas path) using the `canvas` npm package.
 */
import { createCanvas } from 'canvas'

// The tsconfig includes the DOM lib, so TypeScript always sees `document` as
// defined. At runtime in Node.js it is actually undefined, so we cast through
// `unknown` to perform the check without triggering TS errors.
const hasDocument = typeof (globalThis as unknown as Record<string, unknown>)['document'] !== 'undefined'

if (!hasDocument) {
  // Install a minimal document shim so pretext's getMeasureContext() can call
  // document.createElement('canvas') and obtain a 2D rendering context.
  (globalThis as unknown as Record<string, unknown>)['document'] = {
    createElement(tag: string): unknown {
      if (tag === 'canvas') {
        return createCanvas(1, 1)
      }
      throw new Error(`document.createElement('${tag}') not supported in test polyfill`)
    },
  }
}
