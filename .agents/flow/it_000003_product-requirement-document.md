# Requirement: New Shared Hooks — useStickyColumns, useInfiniteScroll, useCanvasCell

> **Core constraint — enforced everywhere in this iteration:**
> All text measurement must go through `@chenglou/pretext` (`prepare()`, `layout()`, `layoutWithLines()`).
> `getBoundingClientRect`, `offsetWidth`, `offsetHeight`, `scrollHeight` (for cell sizing), `ctx.measureText`, and any other DOM or Canvas measurement API are **forbidden** for computing cell or row dimensions.

## Context

The existing hook layer (`src/shared/hooks/`) covers measurement (`useMeasure`), drag-resize state (`useResizable`), container observation (`useExpandable`), virtualized windowing (`useVirtualization`), and row/column drag-and-drop (`useDraggable`). Three high-value primitives are missing:

1. **`useStickyColumns`** — manages a `frozenCount` of left-pinned columns. Returns separate `frozenWidths` and `scrollWidths` arrays that both feed the same `useMeasure` call, keeping row heights in sync between the frozen pane and the scrollable pane. All sizing data comes from `@chenglou/pretext` — no DOM calls.
2. **`useInfiniteScroll`** — manages page loading as the user scrolls toward the bottom. Returns an `onScroll` handler and an `isLoading` flag. Row heights for incoming data are pre-measured with `@chenglou/pretext` before the rows enter the DOM, eliminating the scroll-position jump that DOM-measurement approaches cause.
3. **`useCanvasCell`** — returns a `drawCell(ctx, rowIndex, colIndex, x, y)` function that renders a cell's text onto a `<canvas>` using **only** `layoutWithLines()` pixel coordinates from `@chenglou/pretext` — never `ctx.measureText`. Enables effects impossible in HTML: keyword highlights at exact pixel positions, gradient or drop-shadow text, smooth fade-out truncation, and animated numeric counters.

All three hooks must be standalone composable primitives that follow the existing `src/shared/hooks/` conventions. Rather than adding a new `StickyColumnsTable` component, `useStickyColumns` is wired into the existing **"Visibility · Sorting · Sticky column"** showcase already present in the demo. The demo page is updated to showcase all three hooks in action.

---

## Goals

- Add `useStickyColumns`, `useInfiniteScroll`, and `useCanvasCell` to `src/shared/hooks/` following existing primitives conventions.
- Wire `useStickyColumns` into the existing **"Visibility · Sorting · Sticky column"** showcase in the demo (`src/demo/App.tsx`) — no new table component needed.
- Zero DOM measurement calls in all three hooks — all text metrics come exclusively from `@chenglou/pretext`.
- Unit tests cover the critical state transitions of each hook.
- Demo page is updated to showcase all three hooks.

---

## User Stories

### US-001: useStickyColumns — frozen left-column pane

**As a** library consumer,
**I want** to call `useStickyColumns({ frozenCount, columnWidths })` and receive `frozenWidths` and `scrollWidths` arrays,
**so that** I can render two panes (frozen + scrollable) that share a single `useMeasure` call and stay height-synchronized without touching the DOM.

**Acceptance Criteria:**
- [ ] `useStickyColumns({ frozenCount, columnWidths })` returns `{ frozenWidths, scrollWidths }` where `frozenWidths.length === frozenCount` and `frozenWidths.concat(scrollWidths)` equals `columnWidths`.
- [ ] `frozenWidths` and `scrollWidths` together passed as a single flat array to `useMeasure` produce one `rowHeights[]` shared by both panes.
- [ ] Changing `frozenCount` at runtime correctly re-slices the arrays without re-running `prepare()`.
- [ ] No `getBoundingClientRect`, `offsetWidth`, `offsetHeight`, or any other DOM measurement is used — column widths come from the `columnWidths` prop, not from the DOM.
- [ ] TypeScript strict — no `any`, full type coverage.
- [ ] Unit test: given `columnWidths = [100, 120, 80, 60]` and `frozenCount = 2`, asserts `frozenWidths === [100, 120]` and `scrollWidths === [80, 60]`.
- [ ] Typecheck / lint passes.

---

### US-002: Wire useStickyColumns into the existing sticky-column showcase

**As an** end user of the demo,
**I want** the existing "Visibility · Sorting · Sticky column" section in the demo to use `useStickyColumns`,
**so that** the first frozen column is properly managed through the hook rather than ad-hoc CSS, and the showcase demonstrates real hook usage.

**Acceptance Criteria:**
- [ ] The existing sticky-column showcase in `src/demo/App.tsx` is refactored to call `useStickyColumns({ frozenCount: 1, columnWidths })` and use the returned `frozenWidths` / `scrollWidths` to drive the frozen and scrollable panes.
- [ ] The frozen pane renders the first column with `position: sticky; left: 0` (or equivalent CSS) and does not scroll horizontally.
- [ ] Row heights remain computed by a single `useMeasure` call using all column widths (frozen + scrollable).
- [ ] No bespoke column-slicing or width-partition logic remains in the showcase — it all flows through `useStickyColumns`.
- [ ] No new table component is added to `src/tables/`.
- [ ] Visually verified in browser: the first column stays pinned on horizontal scroll; row heights match across panes; existing visibility-toggle and sort features still work.
- [ ] Typecheck / lint passes.

---

### US-003: useInfiniteScroll — bottom-triggered page loading with pretext pre-measurement

**As a** library consumer,
**I want** to call `useInfiniteScroll({ onLoadMore, threshold? })` and get back `{ onScroll, isLoading }`,
**so that** I can append new rows without a visible scroll-position jump, because their heights are measured by pretext before they enter the DOM.

**Acceptance Criteria:**
- [ ] `useInfiniteScroll({ onLoadMore, threshold? })` returns `{ onScroll, isLoading }`.
- [ ] `onLoadMore` is called when the scroll container is within `threshold` px of the bottom (default 200 px).
- [ ] `isLoading` is `true` from the moment `onLoadMore` is called until the returned Promise resolves.
- [ ] `onLoadMore` must return a `Promise<Row[]>`; the hook pre-measures the incoming rows via `useMeasure` before appending them to state, preventing scroll-position jump.
- [ ] `onLoadMore` is not called again while `isLoading` is `true`.
- [ ] Composes cleanly with `useVirtualization` (the hook does not depend on virtualization but must not conflict with it).
- [ ] No DOM measurement (`getBoundingClientRect`, `offsetHeight`, `scrollHeight` arithmetic) is used for cell or row sizing — only `scrollTop` and `clientHeight` are read, solely for detecting scroll position relative to the bottom.
- [ ] Unit test: calling `onScroll` with a near-bottom position triggers `onLoadMore`; calling it again before the promise resolves does not trigger a second call.
- [ ] Typecheck / lint passes.

---

### US-004: useCanvasCell — pixel-accurate canvas cell rendering

**As a** library consumer,
**I want** to call `useCanvasCell({ prepared, columnWidths, options? })` and get back a `drawCell(ctx, rowIndex, colIndex, x, y)` function,
**so that** I can render cell text onto a `<canvas>` at pixel-accurate positions derived from `layoutWithLines()`, enabling effects like keyword highlights, gradient text, smooth fade-out truncation, and drop shadows.

**Acceptance Criteria:**
- [ ] `useCanvasCell({ prepared, columnWidths, options? })` returns `{ drawCell }` where `drawCell(ctx, rowIndex, colIndex, x, y)` renders the cell at the given canvas offset.
- [ ] `drawCell` uses `layoutWithLines()` coordinates from `@chenglou/pretext` exclusively — `ctx.measureText` and any other Canvas measurement API are **forbidden** for positioning or sizing text.
- [ ] `prepared` input is the `PreparedTextWithSegments[][]` already produced by `useMeasure` — `useCanvasCell` does **not** call `prepare()` internally.
- [ ] `drawCell` supports at least one visual effect selectable via `options`: gradient fill, drop shadow, or smooth fade-out truncation (ellipsis fade).
- [ ] HiDPI / device pixel ratio: `drawCell` accepts an optional `dpr` parameter (default `window.devicePixelRatio ?? 1`) and scales coordinates accordingly.
- [ ] Unit test: `drawCell` called with a mocked `CanvasRenderingContext2D` results in `fillText` being called with positions that match `layoutWithLines()` output for the same row/column.
- [ ] Typecheck / lint passes.

---

### US-005: Demo page update

**As an** end user or library evaluator,
**I want** to see `useStickyColumns`, `useInfiniteScroll`, and `useCanvasCell` demonstrated on the demo page,
**so that** I can understand their capabilities interactively.

**Acceptance Criteria:**
- [ ] Demo page includes a sticky-column section (the existing "Visibility · Sorting · Sticky column" showcase, now using `useStickyColumns`) with ≥ 1 frozen column and enough scrollable columns to require horizontal scrolling.
- [ ] Demo page includes an infinite-scroll section that loads additional rows when scrolled to the bottom, with a visible loading indicator.
- [ ] Demo page includes a canvas section that renders at least one cell effect (e.g. gradient fill or fade-out truncation).
- [ ] All three sections render without console errors.
- [ ] Visually verified in browser.
- [ ] Typecheck / lint passes.

---

## Functional Requirements

- **FR-0 (global constraint): All text and cell dimension data must come exclusively from `@chenglou/pretext` (`prepare()`, `layout()`, `layoutWithLines()`). The following APIs are unconditionally forbidden for cell/row sizing across all hooks and demo code added in this iteration: `getBoundingClientRect`, `offsetWidth`, `offsetHeight`, `scrollHeight` (for sizing), `clientHeight` (for sizing), `ctx.measureText`, `getComputedStyle` for dimensions.**
- FR-1: `useStickyColumns` accepts `{ frozenCount: number; columnWidths: number[] }` and returns `{ frozenWidths: number[]; scrollWidths: number[] }`. It is a pure derivation (no internal state needed beyond the slice indices).
- FR-2: `useStickyColumns` must not call `prepare()` or `layout()` — it only slices the `columnWidths` array.
- FR-3: `useInfiniteScroll` accepts `{ onLoadMore: () => Promise<Row[]>; threshold?: number }` and returns `{ onScroll: React.UIEventHandler; isLoading: boolean }`.
- FR-4: `useInfiniteScroll` is a pure event/flag primitive — it does not manage row state. The consumer calls `onLoadMore`, receives the new rows, and appends them to its own state. The consumer is responsible for pre-measuring incoming rows via `useMeasure` (which uses `@chenglou/pretext` internally) before rendering them.
- FR-5: `useCanvasCell` accepts `{ prepared: PreparedTextWithSegments[][] | null; columnWidths: number[]; options?: CanvasCellOptions }` and returns `{ drawCell: DrawCellFn }`.
- FR-6: `useCanvasCell` must not call `prepare()` internally — it consumes `prepared` from `useMeasure`. All positional data for canvas drawing comes from `layoutWithLines()` output; `ctx.measureText` is never called.
- FR-7: The sticky-column showcase in `src/demo/App.tsx` must use `useStickyColumns` — no bespoke column-slicing or DOM measurement logic in the demo.
- FR-8: All three hooks must be exported from `src/shared/hooks/index.ts`.
- FR-9: No new table component is added to `src/tables/` for sticky columns.
- FR-10: Font strings used in new hooks must come from `src/shared/fonts.ts` — no inline font strings.

---

## Non-Goals (Out of Scope)

- A new `StickyColumnsTable` component — `useStickyColumns` is wired into the existing demo showcase instead.
- Right-pinned or top/bottom sticky header/footer rows (only left-frozen columns in this iteration).
- Bi-directional infinite scroll (prepending rows) — use `useScrollAnchor` (already implemented) for that.
- Full canvas-rendered table (replacing HTML entirely with `<canvas>`) — `useCanvasCell` is a cell-level primitive only.
- Drag handles on frozen columns (`useResizable` + `useStickyColumns` composition) — deferred.
- Virtual scrolling inside the frozen pane — `useStickyColumns` is layout-only.
- Any use of `getBoundingClientRect`, `offsetWidth/Height`, `ctx.measureText`, or other DOM/Canvas sizing APIs — these are forbidden project-wide, not just in this iteration.

---

## Open Questions

- ~~Should `useInfiniteScroll` own its own row state?~~ **Resolved:** `useInfiniteScroll` is a purely an event/flag primitive. It calls `onLoadMore` and exposes `isLoading`; the consumer owns all row state. FR-4 is updated accordingly — the hook does not append rows internally; it only gates the `onLoadMore` call and tracks loading state.
