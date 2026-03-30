# Requirement: New Shared Hooks — useShrinkWrap, useResizePreview, useScrollAnchor

## Context

The existing hook layer (`src/shared/hooks/`) covers measurement (`useMeasure`), drag-resize state (`useResizable`), and container observation (`useExpandable`). Three high-value primitives are missing:

1. **`useShrinkWrap`** — exact minimum-width fit for a column (no DOM calls; binary search over `walkLineRanges()`). Solves the "double-click to auto-size column" use case that `getBoundingClientRect`-based libraries can only approximate.
2. **`useResizePreview`** — while a column drag is in-flight, computes per-row height changes via `layout()` at ~0.09 ms/row and returns a `previewHeights[]` array. Lets the table render a ghost layer without committing a real re-render until drag ends.
3. **`useScrollAnchor`** — when rows are prepended to the dataset (real-time feed, chat history), computes the exact `scrollTop` correction using pretext offsets before the DOM updates. Prevents any visible scroll jump.

All three hooks must be composable standalone primitives. `useShrinkWrap` and `useResizePreview` are additionally wired into `ResizableTable` as first-class features.

---

## Goals

- Add `useShrinkWrap`, `useResizePreview`, and `useScrollAnchor` to `src/shared/hooks/` following the existing primitives pattern.
- Wire `useShrinkWrap` into `ResizableTable` so double-clicking a column resize handle triggers `fitColumn(colIndex)`.
- Wire `useResizePreview` into `ResizableTable` so a ghost layer renders during a column drag, with real heights committing only on drag-end.
- Zero DOM calls in all three hooks — all text metrics come from `@chenglou/pretext` (`walkLineRanges()`, `layout()`).
- Unit tests cover the critical logic of each hook; demo page is updated to showcase all three.

---

## User Stories

### US-001: useShrinkWrap — binary-search minimum column width

**As a** library consumer or ResizableTable user,
**I want** to call `fitColumn(colIndex)` and have the column snap to the minimum width where no cell text wraps,
**so that** I get an exact fit with zero DOM measurements.

**Acceptance Criteria:**
- [ ] `useShrinkWrap(prepared, columnWidths, options?)` is exported from `src/shared/hooks/index.ts`.
- [ ] Returns `{ fitColumn: (colIndex: number) => number }` — the return value is the minimum pixel width.
- [ ] Internally uses `walkLineRanges()` from `@chenglou/pretext`; no `getBoundingClientRect`, `offsetWidth`, or any DOM API.
- [ ] Binary search converges on a width within `±1px` of the true minimum wrap boundary.
- [ ] `fitColumn` handles edge cases: empty column, single-character cells, cells with only whitespace.
- [ ] Typecheck (`tsc --noEmit`) and lint pass.
- [ ] Visually verified in browser via demo page.

---

### US-002: useResizePreview — ghost heights during column drag

**As a** library consumer or ResizableTable user,
**I want** the table to show updated row heights in a ghost/preview layer while I drag a column handle,
**so that** I can see how text will reflow before committing the resize.

**Acceptance Criteria:**
- [ ] `useResizePreview(prepared, dragState, options?)` is exported from `src/shared/hooks/index.ts`.
- [ ] Returns `{ previewHeights: number[] | null }` — `null` when no drag is active.
- [ ] Uses `layout()` from `@chenglou/pretext` to recompute heights for the dragged column; no DOM reads.
- [ ] `previewHeights` updates on every drag-position change (pointer move); real table heights are unchanged until drag ends.
- [ ] Calling overhead per pointer-move event is ≤ 2 ms for tables with up to 200 visible rows (verified via `performance.now()` in a unit test or comment).
- [ ] Typecheck and lint pass.
- [ ] Visually verified in browser via demo page.

---

### US-003: useScrollAnchor — prepend rows without scroll jump

**As a** library consumer building a real-time feed or chat-history table,
**I want** to call `prepend(newRows)` and have `scrollTop` corrected atomically,
**so that** the currently visible row stays stable with no visible jump.

**Acceptance Criteria:**
- [ ] `useScrollAnchor(rowHeights, scrollRef, options?)` is exported from `src/shared/hooks/index.ts`.
- [ ] Returns `{ prepend: (newRows: Row[], atIndex?: number) => void }` — caller passes new rows; `atIndex` defaults to `0` (prepend). Hook handles scroll correction internally.
- [ ] Scroll correction is computed from pretext offsets before the DOM updates (uses the existing `rowHeights[]` from `useMeasure`).
- [ ] No `getBoundingClientRect`, `scrollHeight`, or layout-triggering DOM reads inside `prepend`.
- [ ] Works correctly when prepending 1 row and when prepending many rows at once.
- [ ] Typecheck and lint pass.
- [ ] Visually verified in browser via demo page.

---

### US-004: Wire useShrinkWrap into ResizableTable

**As an** end user of ResizableTable,
**I want** to double-click a column resize handle and have the column auto-size to fit its content exactly,
**so that** I don't have to drag manually to find the right width.

**Acceptance Criteria:**
- [ ] `ResizableTable` accepts an optional `shrinkWrap?: boolean` prop (default `false`); when `true`, double-click on any column handle calls `fitColumn(colIndex)` and updates `columnWidths`.
- [ ] The existing `ResizableTable` API (all current props) is unchanged — no breaking changes.
- [ ] `ResizableTable` does not import `useShrinkWrap` unless `shrinkWrap` is enabled (tree-shaking friendly, or lazy import).
- [ ] Typecheck and lint pass.
- [ ] Visually verified in browser: double-click a handle → column snaps to fit width.

---

### US-005: Wire useResizePreview into ResizableTable

**As an** end user of ResizableTable,
**I want** the table to show a ghost/preview overlay of reflow heights while I drag a column handle,
**so that** I know what the layout will look like before releasing the mouse.

**Acceptance Criteria:**
- [ ] `ResizableTable` accepts an optional `resizePreview?: boolean` prop (default `false`); when `true`, `useResizePreview` is active during drag.
- [ ] The ghost layer is rendered as a **separate absolutely-positioned overlay column** — only the dragged column floats as a translucent ghost panel showing the reflow preview; the rest of the table remains static.
- [ ] Real row heights and real DOM cells are unchanged until `pointerup` / drag-end.
- [ ] The existing `ResizableTable` API is unchanged.
- [ ] Typecheck and lint pass.
- [ ] Visually verified in browser: dragging a handle shows the ghost layer; releasing commits the real heights.

---

### US-006: Demo page updated

**As a** developer evaluating the library,
**I want** the demo page to show each new hook in action,
**so that** I can understand the hooks' behaviour without reading source code.

**Acceptance Criteria:**
- [ ] `src/demo/` is updated with a section (or separate demo table) for `useShrinkWrap` (double-click to fit), `useResizePreview` (ghost layer during drag), and `useScrollAnchor` (prepend button / live feed simulation).
- [ ] Each demo section has a short descriptive label.
- [ ] Demo runs without console errors (`bun run dev`).
- [ ] Visually verified in browser.

---

### US-007: Unit tests for all three hooks

**As a** maintainer,
**I want** Vitest unit tests covering the critical logic of each new hook,
**so that** regressions are caught automatically.

**Acceptance Criteria:**
- [ ] `src/tests/useShrinkWrap.test.ts` — tests: binary search converges, edge cases (empty column, whitespace-only cells).
- [ ] `src/tests/useResizePreview.test.ts` — tests: returns `null` when no drag, returns correct heights when drag state is active.
- [ ] `src/tests/useScrollAnchor.test.ts` — tests: `prepend` computes correct `scrollTop` offset for 1 row and N rows.
- [ ] All new tests pass: `bun test`.
- [ ] No existing tests are broken.

---

## Functional Requirements

- **FR-1** All three hooks live in `src/shared/hooks/` and are re-exported from `src/shared/hooks/index.ts`.
- **FR-2** No hook may call any DOM layout API (`getBoundingClientRect`, `offsetWidth`, `offsetHeight`, `scrollHeight`, `clientHeight`). All text metrics must come from `@chenglou/pretext`.
- **FR-3** `useShrinkWrap` must use `walkLineRanges()` for its binary search convergence check.
- **FR-4** `useResizePreview` must use `layout()` to recompute heights; it receives `prepared` data (from `useMeasure`) so `prepare()` is never called inside it.
- **FR-5** `useScrollAnchor` receives the `rowHeights[]` array already produced by `useMeasure` — it does not call `prepare()` or `layout()` itself.
- **FR-6** `ResizableTable` integration (US-004, US-005) must not introduce breaking changes to the existing prop surface.
- **FR-7** Each hook must be independently importable (consumers using only `useShrinkWrap` do not pay for `useScrollAnchor`).
- **FR-8** Font constants must come from `src/shared/fonts.ts`; no inline font strings inside the hooks.

---

## Non-Goals (Out of Scope)

- Wiring `useScrollAnchor` into any existing pre-built table component (it is a standalone primitive for custom table consumers this iteration).
- Multi-column simultaneous drag preview (only the actively-dragged column's rows are previewed).
- `useShrinkWrap` fitting all columns at once (fit-all); only single-column fit via `fitColumn(colIndex)`.
- Row-height shrink-wrap (only column-width shrink-wrap is in scope).
- Canvas or SVG rendering variants of the ghost layer in `useResizePreview`.
- Accessibility handling for drag-preview or scroll-anchor behaviours.

---

## Open Questions

_All open questions resolved during the requirement interview._

- Ghost layer style for `useResizePreview`: **Option C** — absolutely-positioned overlay column showing only the dragged column as a translucent ghost.
- `useScrollAnchor` insertion scope: **Both** — `prepend` is the primary API; an optional `atIndex` parameter supports arbitrary insertion index.
