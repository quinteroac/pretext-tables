# Requirement: DraggableTable — Row and Column Reordering via Drag

## Context

The existing table components (`BasicTable`, `ExpandableTable`, `ResizableTable`, `VirtualizedTable`) do not support reordering. Developers need a table variant — and a composable hook — that lets end users drag rows and columns to new positions. All row-height calculations must continue to go through `@chenglou/pretext`; no external drag-and-drop libraries are allowed.

## Goals

- Expose a `useDraggable` hook that manages drag state (active item, drag type, reordered indices) independently of any specific table.
- Provide a `DraggableTable` component that composes `useDraggable` with `useMeasure` to deliver a ready-to-use draggable table.
- Allow developers to compose `useDraggable` with other hooks (`useResizable`, `useExpandable`) for custom tables.

## User Stories

### US-001: Drag rows to reorder

**As a** developer using `DraggableTable`, **I want** end users to be able to drag a row to a new position **so that** the displayed row order updates to reflect the new arrangement.

**Acceptance Criteria:**
- [ ] Each row displays a grip icon (e.g. ⠿) AND the entire row header area is draggable; either initiates a drag on `pointerdown`.
- [ ] While dragging, a visual placeholder or ghost indicates the target drop position.
- [ ] On drop, the row order in the rendered table updates immediately.
- [ ] An optional `onRowsReorder(newOrder: number[])` callback fires with the updated index mapping.
- [ ] Row heights re-derived from `useMeasure` remain correct after reorder (no stale heights).
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: dragging a row moves it to the dropped position.

### US-002: Drag columns to reorder

**As a** developer using `DraggableTable`, **I want** end users to be able to drag a column header to a new position **so that** the column order updates across all rows.

**Acceptance Criteria:**
- [ ] Each column header displays a grip icon AND the entire header cell is draggable; either initiates column reorder mode on `pointerdown`.
- [ ] While dragging, a visual indicator shows where the column will be inserted.
- [ ] On drop, all rows rerender with the new column order.
- [ ] An optional `onColumnsReorder(newOrder: number[])` callback fires with the updated index mapping.
- [ ] Column widths track the new column order correctly (widths follow their column, not their slot).
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: dragging a column header moves the column to the dropped position.

### US-003: `useDraggable` hook for custom composition

**As a** developer building a custom table, **I want** a standalone `useDraggable` hook **so that** I can add drag-reorder behaviour to any table without being forced to use `DraggableTable`.

**Acceptance Criteria:**
- [ ] `useDraggable({ rowCount, columnCount, onRowsReorder?, onColumnsReorder? })` is exported from `src/shared/hooks/index.ts`.
- [ ] The hook returns: `rowOrder: number[]`, `columnOrder: number[]`, `dragging: { type: 'row'|'column'; index: number } | null`, `getRowHandleProps(rowIndex)`, `getColHandleProps(colIndex)`.
- [ ] The hook does not reference any DOM measurement APIs (`getBoundingClientRect`, `offsetHeight`, etc.).
- [ ] A usage example in `src/demo/App.tsx` demonstrates composing `useDraggable` with `useMeasure`.
- [ ] Typecheck / lint passes.

## Functional Requirements

- FR-1: Drag logic must use native pointer events (`pointerdown`, `pointermove`, `pointerup`) or HTML5 drag-and-drop — no third-party DnD library.
- FR-2: No external drag-and-drop dependency may be added. The only measurement dependency is `@chenglou/pretext`.
- FR-3: `useDraggable` must be implemented in `src/shared/hooks/useDraggable.ts` and re-exported from `src/shared/hooks/index.ts`.
- FR-4: `DraggableTable` must live in `src/tables/draggable-table/` with `index.tsx`, `measure.ts`, and a CSS file, following the three-layer architecture in `AGENTS.md`.
- FR-5: `DraggableTable` must be exported from `src/tables/index.ts`.
- FR-6: Row heights must always flow through `useMeasure`; `DraggableTable` must not call `prepare()` directly.
- FR-7: After a row or column reorder the component must not trigger a full remeasure unless the data or column widths actually changed.
- FR-8: Font constants must come from `src/shared/fonts.ts`; no inline font strings.

## Non-Goals (Out of Scope)

- Drag-to-sort with animated transitions (CSS transitions on placeholder are fine; JS animation libraries are not).
- Touch-based drag on mobile (pointer events cover touch via `touch-action: none`, but no mobile-specific UX is required).
- Multi-row or multi-column selection and drag.
- Integration with `VirtualizedTable` in this iteration.
- Persisting order to a backend or external store (callbacks only).

## Open Questions

- ~~Should the drag handle be a dedicated grip icon inside the cell, or should the entire row/header be draggable?~~
  **Resolved:** Both — a grip icon (e.g. ⠿) is shown inside the cell AND the whole row/column header is draggable.
- Should `DraggableTable` also support column resizing by composing `useResizable`, or is that deferred to a later iteration?
  *(Unresolved — deferred to implementation decision.)*
