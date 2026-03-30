# Audit — Iteration 000001

## Executive Summary

The `ColumnControlsTable` implementation is largely compliant with the PRD. 8 of 9 functional requirements comply (FR-9 partially), and 4 of 5 user stories fully comply. The one meaningful gap is US-001 AC03: clicking a *different* column header should reset sort to unsorted per the literal acceptance criterion, but the implementation transitions to ascending on the new column instead. A secondary minor gap is FR-9: `measure.ts` is missing the `MIN_COLUMN_WIDTH` constant listed in the PRD. All 37 unit tests pass. The hook (`useColumnControls`) is purely stateful with zero pretext calls, sort is applied before `useMeasure`, hidden columns are excluded from measurement, sticky is CSS-only, and the demo showcases all features with 5 columns and 12 rows.

---

## Verification by FR

| FR | Assessment | Notes |
|---|---|---|
| FR-1 | comply | `useColumnControls` has no pretext import or call |
| FR-2 | comply | `useMeasure` used; zero DOM measurement |
| FR-3 | comply | `sortedRows` computed before `useMeasure` |
| FR-4 | comply | Only visible column cells/widths passed to `useMeasure` |
| FR-5 | comply | Pure CSS `th:first-child` / `td:first-child` sticky |
| FR-6 | comply | No new external packages |
| FR-7 | comply | `BODY_FONT` / `HEADER_FONT` imported from `fonts.ts` |
| FR-8 | comply | Exported from `src/tables/index.ts` |
| FR-9 | partially_comply | Only numeric constants ✓, but `MIN_COLUMN_WIDTH` is absent |

---

## Verification by US

| US | Assessment | Notes |
|---|---|---|
| US-001 Sortable Columns | partially_comply | AC03 gap: clicking a different header transitions to asc on that column instead of resetting to unsorted |
| US-002 Column Visibility Toggle | comply | Checkbox UI above table, min-1 enforced, hidden cols excluded from measurement |
| US-003 Sticky / Frozen First Column | comply | CSS `position:sticky`, box-shadow separator, no JS scroll listeners |
| US-004 `useColumnControls` Hook | comply | Correct shape, barrel export, no pretext calls — all 17 hook tests pass |
| US-005 Demo Showcase | comply | 5 columns, 12 rows, visibility toggle, horizontal overflow observable |

---

## Minor Observations

1. **AC03 ambiguity** — "clicking a different header resets sort to none" could be read as the previous column's indicator clearing (which does happen). The recommendation is to implement the literal AC: clicking a new column header resets sort to unsorted; a subsequent click on that column starts ascending.
2. **`MIN_COLUMN_WIDTH` missing** from `measure.ts` despite being listed in FR-9's parenthetical list of expected constants.
3. **`useSortable` overlap** — an existing `useSortable` hook covers similar sort-state logic; `useColumnControls` duplicates it inline. Below the three-table extraction threshold, but worth tracking.
4. **`renderCell` uses original `colIndex`** (not remapped visible-column index) — consistent with other tables but may surprise consumers when columns are hidden.

---

## Conclusions and Recommendations

Two targeted fixes are required:
1. Update `setSort` in `useColumnControls.ts` so that clicking a *different* column header resets the sort state to `{ key: null, direction: null }` (unsorted), matching US-001 AC03 literally.
2. Add `MIN_COLUMN_WIDTH = 60` to `src/tables/column-controls-table/measure.ts` to satisfy FR-9.

Update the corresponding test (`setSort(different id) resets to asc on new column`) to reflect the corrected behaviour. No other changes are required.

---

## Refactor Plan

### Fix 1 — `useColumnControls.ts`: reset sort when clicking a different column

**File:** `src/shared/hooks/useColumnControls.ts`

Change `setSort` so that a click on a column different from the current `sortKey` resets the sort to unsorted (key: null, direction: null) rather than transitioning to ascending on the new column.

```
Before:
  if (prev.key !== id) return { key: id, direction: 'asc' }

After:
  if (prev.key !== id) return { key: null, direction: null }
```

Sort cycle becomes: none → asc (click same column) → desc → none. Clicking a *different* column while any sort is active resets to none; clicking it again then sets ascending.

### Fix 2 — `measure.ts`: add MIN_COLUMN_WIDTH

**File:** `src/tables/column-controls-table/measure.ts`

Add:
```ts
export const MIN_COLUMN_WIDTH = 60
```

### Fix 3 — Update affected test

**File:** `src/tests/use-column-controls.test.ts`

Update the `setSort(different id)` test to expect `{ key: null, direction: null }` instead of `{ key: 'b', direction: 'asc' }`.
