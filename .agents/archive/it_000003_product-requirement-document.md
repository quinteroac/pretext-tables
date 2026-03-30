# Requirement: VirtualizedTable — Windowed Rendering with Pretext-Measured Heights

## Context

The existing table components (`BasicTable`, `ExpandableTable`, `ResizableTable`) render every row in the DOM. For large datasets (thousands of rows) this is prohibitively slow. A virtualized (windowed) table variant is needed that renders only the rows currently visible in the viewport while still computing exact row heights via `@chenglou/pretext` — no DOM reflows, no height estimation. Because pretext pre-computes all row heights before any rendering, the total scroll height is known exactly upfront, which makes the windowing logic both simpler and more accurate than typical virtualization libraries.

No new dependencies are introduced. Windowing is implemented from scratch using only `@chenglou/pretext` for measurement.

## Goals

- Deliver a `VirtualizedTable` component that renders only visible rows using pretext-measured heights.
- Prove that pretext's upfront height knowledge eliminates the need for a third-party virtualization library.
- Add the component to the existing developer demo page alongside `BasicTable`, `ExpandableTable`, and `ResizableTable`.

## User Stories

### US-001: Mount VirtualizedTable with a large dataset

**As a** developer, **I want** to import `<VirtualizedTable>` and pass it a large array of rows **so that** I can display thousands of rows without adding any new dependencies.

**Acceptance Criteria:**
- [ ] `VirtualizedTable` is exported from `src/tables/index.ts`
- [ ] Component accepts `rows: Row[]`, `columnWidths: number[]`, and `height: number` (viewport height in px) as required props
- [ ] Component renders without errors when mounted with 10,000+ rows
- [ ] Typecheck (`tsc --noEmit`) passes
- [ ] Lint passes

---

### US-002: Only visible rows are rendered in the DOM

**As a** developer, **I want** only the rows currently visible in the scroll viewport to be present in the DOM **so that** the browser does not pay the cost of rendering thousands of off-screen rows.

**Acceptance Criteria:**
- [ ] At any scroll position, the number of rendered row elements equals approximately `Math.ceil(height / minRowHeight) + overscan`, not the full dataset size
- [ ] The scrollable container's total height equals the sum of all pretext-computed row heights (so the scrollbar reflects the true content size)
- [ ] Each visible row is absolutely positioned at the correct `top` offset derived from the cumulative sum of preceding row heights
- [ ] No `getBoundingClientRect`, `offsetHeight`, or any DOM measurement API is used for row sizing
- [ ] Visually verified in browser: rows appear at correct positions, no gaps or overlaps during scroll
- [ ] Typecheck and lint pass

---

### US-003: Smooth scroll with correct row heights

**As a** developer, **I want** scrolling through a large dataset to remain smooth and for row heights to match the multi-line text wrapping computed by pretext **so that** users see no layout jumps or height mismatches.

**Acceptance Criteria:**
- [ ] Scrolling through 10,000 rows with mixed single- and multi-line cells does not produce visible row height errors or content clipping
- [ ] Row heights update correctly when `columnWidths` change (re-runs `useMeasure` as per existing pattern)
- [ ] Scroll position is preserved (or gracefully reset) when `rows` or `columnWidths` props change
- [ ] Visually verified in browser: all cell text is fully visible at every scroll position
- [ ] Typecheck and lint pass

---

### US-004: VirtualizedTable shown in the demo page

**As a** developer, **I want** the existing demo page to include a `VirtualizedTable` section with a large dataset **so that** I can visually inspect and compare the component during development.

**Acceptance Criteria:**
- [ ] `src/demo/App.tsx` imports and renders `<VirtualizedTable>` with at least 500 rows and 3 columns
- [ ] At least one column contains text long enough to trigger multi-line wrapping
- [ ] The demo section has a visible label ("VirtualizedTable") consistent with the style of the other demo sections
- [ ] The page loads in the browser without console errors
- [ ] Visually verified in browser: table scrolls through all rows with correct heights

---

## Functional Requirements

- FR-1: `VirtualizedTable` must accept `rows: Row[]`, `columnWidths: number[]`, and `height: number` as required props. An optional `overscan?: number` prop (default `3`) controls how many off-screen rows above and below the viewport are rendered as a buffer.
- FR-2: All `prepare()` and `layout()` calls must go through `useMeasure` from `src/shared/hooks/useMeasure.ts` — no direct pretext imports in the component file.
- FR-3: The windowing logic (computing `startIndex`, `endIndex`, and row offsets from `rowHeights`) must live in a dedicated hook `src/shared/hooks/useVirtualization.ts`.
- FR-4: Font constants used for measurement must be imported from `src/shared/fonts.ts` — never inlined.
- FR-5: The scrollable container must be a single `div` with `overflow-y: auto` and an explicit `height` equal to the `height` prop. An inner `div` with `position: relative` and `height` equal to the total scroll height holds all absolutely-positioned row wrappers.
- FR-6: `@chenglou/pretext` is the only permitted text-measurement library. No virtualization packages (e.g. `react-virtual`, `react-window`) may be added.
- FR-7: The new hook `useVirtualization` must be exported from `src/shared/hooks/index.ts` (or equivalent barrel) alongside the other shared hooks.
- FR-8: Table-scoped constants (`LINE_HEIGHT`, `CELL_PADDING`, `MIN_COLUMN_WIDTH`) must be defined in `src/tables/virtualized-table/measure.ts` — not inlined in the component.

## Non-Goals (Out of Scope)

- Horizontal virtualization (only rows are windowed; all columns are always rendered).
- Sorting, filtering, or pagination.
- Editable cells.
- User-driven column or row resizing (no drag handles in this variant).
- Sticky / frozen header row (deferred to a future iteration).
- Accessibility enhancements beyond what the existing tables provide.

## Open Questions

- None
