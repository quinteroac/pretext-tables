# Requirement: ColumnControlsTable — Sortable Columns, Column Visibility Toggle, and Sticky Columns

## Context

The project already ships `BasicTable`, `ResizableTable`, `ExpandableTable`, `DraggableTable`, and `VirtualizedTable`. None of these provide column management capabilities: sorting rows by a column, hiding/showing individual columns, or pinning a column so it stays visible during horizontal scroll.

Developers integrating these tables often need all three capabilities together in a data-dense UI. This iteration adds `ColumnControlsTable`, a new table variant that composes a dedicated `useColumnControls` hook with the existing `useMeasure` hook to deliver all three features — using only `@chenglou/pretext` for text measurement, with no external libraries.

## Goals

- Provide a pre-composed `ColumnControlsTable` component that supports column sorting, visibility toggling, and sticky (frozen) columns.
- Introduce a reusable `useColumnControls` hook that other developers can compose in custom tables.
- Add a demo showcase in the existing demo page so the feature is immediately visible and testable in the browser.
- Cover core logic with unit tests (sort order, visibility state, sticky configuration).

## User Stories

### US-001: Sortable Columns
**As a** developer integrating `ColumnControlsTable`, **I want** to click a column header to sort rows ascending/descending by that column **so that** end users can quickly order data without custom sort logic.

**Acceptance Criteria:**
- [ ] Clicking a header with no current sort sets that column to ascending sort.
- [ ] Clicking the same header again switches to descending sort.
- [ ] Clicking a third time (or clicking a different header) resets sort to none (unsorted).
- [ ] Sort indicator (▲ / ▼) is visible in the active column header; no indicator is shown when unsorted.
- [ ] Rows re-render in the correct order; `useMeasure` recomputes row heights for the sorted order.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser.

### US-002: Column Visibility Toggle
**As a** developer integrating `ColumnControlsTable`, **I want** to show or hide individual columns via a UI control **so that** users can focus on the columns relevant to their task.

**Acceptance Criteria:**
- [ ] Each column can be toggled visible/hidden via `useColumnControls` state.
- [ ] Hidden columns are fully removed from the rendered layout (not just collapsed); `useMeasure` only measures visible columns.
- [ ] A column visibility toggle UI (checkbox list or button group) is rendered above the table in the demo showcase.
- [ ] At least one column must always remain visible (the hook enforces a minimum of 1 visible column and prevents hiding the last visible one).
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser.

### US-003: Sticky / Frozen First Column
**As a** developer integrating `ColumnControlsTable`, **I want** the first column to stay fixed while the table scrolls horizontally **so that** row identity (e.g. a name or ID column) is always visible.

**Acceptance Criteria:**
- [ ] When table content overflows horizontally, the first column stays pinned at the left edge.
- [ ] The sticky column is styled with a visible separator (box-shadow or border) to distinguish it from scrolling columns.
- [ ] Sticky behaviour is implemented via CSS (`position: sticky`) — no JavaScript scroll listeners.
- [ ] `useMeasure` still correctly computes heights for all columns including the sticky one.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser with horizontal overflow.

### US-004: `useColumnControls` Hook
**As a** developer building a custom table, **I want** a standalone `useColumnControls` hook **so that** I can add sort, visibility, and sticky logic to any table without re-implementing state management.

**Acceptance Criteria:**
- [ ] `useColumnControls(columns)` accepts an initial column definitions array: `{ id: string; label: string; defaultVisible?: boolean; sticky?: boolean }[]`.
- [ ] Returns: `visibleColumns`, `allColumns`, `sortKey`, `sortDirection`, `toggleColumnVisibility(id)`, `setSort(id)`, `resetSort()`.
- [ ] The hook is exported from `src/shared/hooks/` barrel.
- [ ] Hook does not import or call `prepare()` / `layout()` directly.
- [ ] Typecheck / lint passes.

### US-005: Demo Showcase
**As a** developer evaluating the library, **I want** a demo section for `ColumnControlsTable` in the existing demo page **so that** I can see all three features working together without writing any code.

**Acceptance Criteria:**
- [ ] The demo renders `ColumnControlsTable` with at least 4 columns and 10+ rows of sample data.
- [ ] The demo includes the column visibility toggle UI.
- [ ] Horizontal overflow is present so the sticky column behaviour is observable.
- [ ] Visually verified in browser.

## Functional Requirements

- FR-1: `useColumnControls` must be a pure React hook with no pretext calls inside it.
- FR-2: `ColumnControlsTable` must use `useMeasure` for all cell height computation; no `getBoundingClientRect` or DOM measurement.
- FR-3: Sort logic must operate on the `rows` array before passing to `useMeasure`, so heights are computed in final display order.
- FR-4: Only visible columns are passed to `useMeasure`; hidden columns must not contribute to column widths or row height calculations.
- FR-5: Sticky column is always the first column by position; arbitrary sticky columns are out of scope.
- FR-6: No external libraries beyond `@chenglou/pretext` and React may be introduced.
- FR-7: Font constants must be sourced from `src/shared/fonts.ts`; no inline font strings.
- FR-8: `ColumnControlsTable` must be exported from `src/tables/index.ts`.
- FR-9: `src/tables/column-controls-table/measure.ts` must contain only numeric constants (`LINE_HEIGHT`, `CELL_PADDING`, `MIN_COLUMN_WIDTH`).

## Non-Goals (Out of Scope)

- Multi-column sort (sorting by more than one column simultaneously).
- Arbitrary sticky columns (sticky last column or sticky middle columns).
- Column reordering (drag-and-drop) — that is `DraggableTable`'s domain.
- Resizable column widths — use `ResizableTable` for that.
- Server-side sorting or pagination.
- Editable cells.
- Row selection / checkboxes.

## Open Questions

- None.
