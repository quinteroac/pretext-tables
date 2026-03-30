# Audit — Iteration 000004: DraggableTable

## Executive Summary

The DraggableTable iteration delivers a structurally complete implementation: all files are in the correct locations, exports are wired correctly, font constants come from `fonts.ts`, no third-party DnD library was introduced, and the three-layer architecture is followed. However, a **critical logic bug** in `useDraggable.ts` renders the core drag-reorder functionality non-functional for both rows and columns.

In the `onDrop` handler, both the `rowIndex`/`colIndex` closure variable (the drop target's own visual index) and `dragOverIndex.current` (set by the same element's `onDragEnter`) are always equal — so the guard condition `target !== rowIndex` is always `false` and `reorder()` is never called. All 26 tests pass because they only exercise the pure `reorder()` utility function, not the drag event handlers.

Secondary issues: the `DraggableDemo` in App.tsx passes reordered rows to `useMeasure` (unnecessary `prepare()` remeasures on reorder) and uses an inline font string in one container div.

---

## Verification by FR

| FR | Assessment | Notes |
|---|---|---|
| FR-1 | ✅ comply | HTML5 drag-and-drop API used (`draggable`, `dataTransfer`, `onDragStart/Enter/Over/Drop/End`). PRD allows "pointer events OR HTML5 drag-and-drop". |
| FR-2 | ✅ comply | `package.json` confirms no external DnD dependency. Only `@chenglou/pretext` as measurement dep. |
| FR-3 | ✅ comply | `useDraggable` in `src/shared/hooks/useDraggable.ts`, re-exported from `src/shared/hooks/index.ts` with all types. |
| FR-4 | ✅ comply | `src/tables/draggable-table/` has `index.tsx`, `measure.ts`, `draggable-table.css`. |
| FR-5 | ✅ comply | `DraggableTable` and `DraggableTableProps` exported from `src/tables/index.ts`. |
| FR-6 | ✅ comply | `DraggableTable` calls `useMeasure()`, never imports or calls `prepare()` directly. |
| FR-7 | ✅ comply | `DraggableTable` passes original `rows` prop (not reordered slice) to `useMeasure`. Heights indexed by `dataIndex` — stable across reorders. |
| FR-8 | ⚠️ partially comply | `DraggableTable` imports `BODY_FONT`/`HEADER_FONT` from `fonts.ts` correctly. `DraggableDemo` in App.tsx uses inline `fontFamily: 'Inter, sans-serif', fontSize: 14` in the container div. |

---

## Verification by US

| US | Assessment | Notes |
|---|---|---|
| US-001 | ⚠️ partially comply | Grip icon (⠿) rendered, `<tr>` is `draggable`, visual CSS feedback implemented, callback wired. **Critical: `onDrop` never executes `reorder()` due to the bug described above.** |
| US-002 | ⚠️ partially comply | Grip icon in `<th>`, entire header cell draggable, visual indicators implemented, callback wired. **Same `onDrop` bug.** |
| US-003 | ⚠️ partially comply | Hook API matches spec exactly; no DOM measurement APIs; demo composes `useDraggable` with `useMeasure`. **But handlers produce no working reorder due to the bug.** |

---

## Minor Observations

1. No `aria-grabbed` / `aria-dropeffect` attributes on draggable elements — drag-reorder is inaccessible to screen readers.
2. `cursor: grab` is only on `.draggable-table-grip` and `<th>` — `<tr>` and `<td>` data cells show no grab cursor, so the full-row drag affordance is invisible to users.
3. All 26 tests cover only the `reorder()` pure function. No test simulates or mocks drag events (`onDragStart`, `onDragEnter`, `onDrop`), leaving the event-handler logic untested.
4. `DraggableDemo` in App.tsx defines local `LINE_HEIGHT = 20`, `CELL_PADDING_V = 12`, `CELL_PADDING_H = 12` instead of importing from `measure.ts`, creating values that could drift.
5. `dragOverIndex` ref is shared between row-drag and column-drag — harmless today (only one can be active at a time) but coupling is unnecessary.

---

## Conclusions and Recommendations

The architecture is correct. The single critical fix is in `useDraggable.ts`:

**Root cause:** `onDrop` fires on the *drop target* element. The handler's closure variable `rowIndex`/`colIndex` is the target's own visual index. `dragOverIndex.current` is also the target's index (set by the target's own `onDragEnter`). They are always equal → `target !== rowIndex` is always `false` → `reorder()` is never called.

**Fix:** Introduce a `dragSourceRef = useRef<number | null>(null)`, set it in `onDragStart` to the source element's index, and use it in `onDrop` as the `from` parameter. Use `rowIndex`/`colIndex` (the drop target) as `to`. Apply symmetrically for both `getRowHandleProps` and `getColHandleProps`.

Secondary fixes:
- Fix `DraggableDemo` in App.tsx to pass original `rows`/`columnWidths` to `useMeasure` and derive the visual reordering at render time.
- Replace inline font strings in `DraggableDemo` with imports from `fonts.ts`.
- Add `cursor: grab` to `<tr>` in the CSS so the full-row drag affordance is visible.

---

## Refactor Plan

### Step 1 — Fix `useDraggable.ts` (critical)

Introduce a `dragSourceRef` to track the drag source, and fix `onDrop` in both `getRowHandleProps` and `getColHandleProps`.

**Before (broken):**
```typescript
const dragOverIndex = useRef<number | null>(null)

// In getRowHandleProps(rowIndex):
onDragEnter() { dragOverIndex.current = rowIndex },
onDrop(e) {
  const target = dragOverIndex.current
  if (target !== null && target !== rowIndex) {  // always false!
    setRowOrder(prev => reorder(prev, rowIndex, target))
  }
}
```

**After (correct):**
```typescript
const dragSourceRef = useRef<number | null>(null)
const dragOverIndex = useRef<number | null>(null) // kept for drop-target visual tracking

// In getRowHandleProps(rowIndex):
onDragStart(e) {
  dragSourceRef.current = rowIndex   // save source index
  setDragging({ type: 'row', index: rowIndex })
  e.dataTransfer.effectAllowed = 'move'
},
onDragEnter() { dragOverIndex.current = rowIndex },
onDrop(e) {
  e.preventDefault()
  const from = dragSourceRef.current  // source
  const to = rowIndex                 // this element = drop target
  if (from !== null && from !== to) {
    setRowOrder(prev => {
      const next = reorder(prev, from, to)
      onRowsReorder?.(next)
      return next
    })
  }
  dragSourceRef.current = null
  dragOverIndex.current = null
  setDragging(null)
}
```

Apply the same pattern to `getColHandleProps` (using `dragSourceRef` for `from`, `colIndex` for `to`).

### Step 2 — Fix `DraggableDemo` in App.tsx (FR-7, FR-8)

- Pass original `rows` and `DRAGGABLE_COLUMN_WIDTHS` to `useMeasure` — derive the visual ordering at render time from `rowOrder`/`columnOrder` without creating new arrays as `useMeasure` dependencies.
- Replace `fontFamily: 'Inter, sans-serif', fontSize: 14` with constants from `fonts.ts`.

### Step 3 — Fix CSS affordance (UX)

Add `cursor: grab` to `tr` rows in `draggable-table.css` (not just `.draggable-table-grip`).

### Step 4 — Add drag-event integration tests

Add at least one test that simulates `onDragStart` → `onDragEnter` → `onDrop` via `renderHook` + synthetic events, covering the row and column reorder happy paths.
