# AGENTS.md — pretext-tables conventions

Guidelines for working on this project. Read this before writing or modifying code.

## Project purpose

Build a collection of UI table components where cell heights are computed with `@chenglou/pretext` before rendering — no DOM reflows, no `getBoundingClientRect`, no layout thrash.

---

## Core rule: prepare outside render

Every component must separate the `prepare()` call from the render cycle. This is the single most important constraint in this codebase.

```ts
// Correct — prepare once when data arrives
const prepared = useMemo(() => rows.map(r => prepareWithSegments(r.text, FONT)), [rows])

// Wrong — never do this
function Row({ text }) {
  const prepared = prepareWithSegments(text, FONT) // called on every render
}
```

In practice, **never call `prepare()` directly in a component**. All pretext logic goes through `useMeasure` (see below).

If you touch a table component and `prepare()` is inside a render function or a `useEffect` that runs on every render, fix it before doing anything else.

---

## File structure

```
src/
  shared/
    fonts.ts           # font constants shared across all tables
    types.ts           # shared TypeScript types (Row, etc.)
    hooks/
      useMeasure.ts    # prepare() + layout() + fontsReady — used by every table
      useExpandable.ts # ResizeObserver wrapper — whole-table container resize
      useResizable.ts  # drag handles for column widths and row heights
  tables/
    index.ts           # re-exports every table component
    <table-name>/
      index.tsx        # component entry point — uses hooks, no pretext calls
      measure.ts       # table-scoped constants only (LINE_HEIGHT, CELL_PADDING, …)
      <table-name>.css # scoped styles
```

---

## Three-layer architecture

### Layer 1 — Primitives (`src/shared/hooks/`)

Stateful React hooks independent of any table.

| Hook | Responsibility |
|---|---|
| `useMeasure(rows, columnWidths, options?)` | Owns `fontsReady`, `prepare()`, and `layout()`. Returns `rowHeights[]`. |
| `useResizable(options)` | Manages column-width and row-height drag state. Returns `columnWidths`, `manualRowHeights`, and handle prop factories. |
| `useExpandable(options?)` | Wraps ResizeObserver. Returns a ref and fires `onResize(w, h, prevW, prevH)` on container size changes. |

### Layer 2 — Table components (`src/tables/<name>/`)

Each table is a pre-composed, ready-to-use component built on top of the hooks above.

| Component | Hooks used | Behaviour |
|---|---|---|
| `BasicTable` | `useMeasure` | Fixed column widths, no interaction. |
| `ExpandableTable` | `useMeasure` + `useExpandable` + `useResizable`* | Scales all columns proportionally when its container resizes. Container has `resize: horizontal`. |
| `ResizableTable` | `useMeasure` + `useResizable` | Drag handles for columns (`horizontal`) and/or row height overrides (`vertical`). Fixed container. |

\* `useResizable` is used in `ExpandableTable` only for `setColumnWidths` state — drag handles are disabled.

### Layer 3 — Custom tables

Users can compose hooks directly when the pre-built tables don't fit:

```ts
import { useMeasure, useExpandable, useResizable } from '../shared/hooks/index.js'

function MyTable({ rows, defaultColumnWidths }) {
  const { columnWidths, setColumnWidths, getColHandleProps } = useResizable({ defaultColumnWidths, horizontal: true })
  const containerRef = useExpandable({
    onResize(w, _h, prev) {
      setColumnWidths(cols => cols.map(c => Math.max(c * (w / prev), 60)))
    },
  })
  const rowHeights = useMeasure(rows, columnWidths)
  // … render
}
```

---

## `measure.ts` is constants only

Each table's `measure.ts` holds **only numeric constants for that table**. All pretext logic lives in `useMeasure`.

```ts
// src/tables/my-table/measure.ts — correct
export const LINE_HEIGHT = 20
export const CELL_PADDING = 16
export const MIN_COLUMN_WIDTH = 60

// Wrong — do not put prepare() or layout() calls here
```

---

## Naming conventions

- Table components: PascalCase (`BasicTable`, `ExpandableTable`, `ResizableTable`)
- Hooks: camelCase prefixed with `use` (`useMeasure`, `useResizable`, `useExpandable`)
- Font constants: `SCREAMING_SNAKE_CASE` (`BODY_FONT`, `HEADER_FONT`)
- Measure constants: `SCREAMING_SNAKE_CASE` (`LINE_HEIGHT`, `CELL_PADDING`, `MIN_COLUMN_WIDTH`)

---

## Font constants

Define all fonts in `src/shared/fonts.ts`. Never hardcode font strings inside components or hooks.

```ts
export const BODY_FONT = '14px Inter, sans-serif'
export const HEADER_FONT = 'bold 14px Inter, sans-serif'
export const MONO_FONT = '13px "JetBrains Mono", monospace'
```

`useMeasure` waits for `document.fonts.ready` internally. You do not need to handle this in components.

---

## Adding a new table

1. Create `src/tables/<table-name>/` with `index.tsx`, `measure.ts`, and a CSS file.
2. `measure.ts` exports only constants — `LINE_HEIGHT`, `CELL_PADDING`, any table-specific minimums.
3. `index.tsx` imports `useMeasure` (and optionally `useResizable` / `useExpandable`) — no direct pretext imports.
4. Export the component from `src/tables/index.ts`.
5. Use font constants from `src/shared/fonts.ts` — do not inline font strings.

---

## What not to do

- Do not call `prepare()` or `layout()` directly in a component — use `useMeasure`.
- Do not call `prepare()` in a render function, a `useEffect` without a stable dependency, or a `requestAnimationFrame` callback.
- Do not use `getBoundingClientRect`, `offsetHeight`, or any DOM measurement for cell sizing — that's what pretext replaces.
- Do not mix `useExpandable` and drag handles in the same table — that's two different table types.
- Do not add a new font string without adding it to `src/shared/fonts.ts` first.
- Do not add abstractions for patterns used in only one table. Wait until a pattern appears in three or more tables before extracting it.

---

## Skills

Use the project skills when writing or debugging pretext code:

- `/pretext-docs` — API reference (function signatures, types, options)
- `/pretext-integrate` — guided integration patterns (virtual list, Canvas, SSR, shrink-wrap)
- `/pretext-art` — Canvas/SVG artistic text effects
