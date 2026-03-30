---
name: pretext-tables
description: >
  Implement React table components with reflow-free text measurement using
  @chenglou/pretext. Use this skill when the user asks to build a table with
  dynamic row heights, virtualized scroll, resizable columns, inline editing,
  drag-to-reorder, or any table feature where accurate pre-render text
  measurement matters. Triggers on: "build a table", "add a table component",
  "virtualized table", "table with dynamic row heights", "resizable columns",
  "pretext table", "use pretext for a table", "table without reflow".
user-invocable: true
---

# Skill: pretext-tables

Build React table components powered by `@chenglou/pretext` — text is measured
before rendering so row heights are exact, columns resize without reflow, and
large datasets virtualize without scroll jitter.

## Core concept

`@chenglou/pretext` separates text measurement into two phases:

- **`prepare()`** — Canvas font measurement, ~19 ms for 500 texts. Runs once per (data, font) change.
- **`layout()`** — Pure arithmetic line-breaking at a given width, ~0.09 ms per text. Runs on every resize.

This means row heights are known before the first paint. No `getBoundingClientRect`,
no `ResizeObserver` for height, no reflow.

## Instructions

### 1. Understand what the table needs

Before writing any code, clarify:

- **Data shape** — columns, content type (plain text, badges, images, editable fields)?
- **Scale** — row count? Under ~100: no virtualization needed. Over ~100: add `useVirtualization`.
- **Interactions** — resize, drag-to-reorder, sort, filter, inline edit, export?

Pick only the hooks the table needs. Each one is independent.

### 2. Always start with `useMeasure`

Every pretext table starts here. Read the reference implementation at
`references/useMeasure.ts` in this skill for the full source.

```ts
const { rowHeights, prepared } = useMeasure(rows, columnWidths, {
  font: '14px "Inter", system-ui, sans-serif',
  lineHeight: 20,
  cellPadding: 16, // total left + right padding
})
```

**Two-phase rule:** Never call `prepareWithSegments` inside a render loop or resize
handler. `useMeasure` memoizes each phase correctly — `prepare()` on `[rows, font]`,
`layout()` on `[prepared, columnWidths]`.

Pass `prepared` to downstream hooks (`useResizePreview`, `useShrinkWrap`, etc.)
so they never re-run the Canvas phase.

### 3. Wait for fonts

`useMeasure` returns `prepared = null` until `document.fonts.ready` resolves.
During that window, `rowHeights` contains placeholder heights. Render a skeleton
or defer rendering until `prepared !== null`.

Always match the `font` string passed to `useMeasure` exactly to the font used
in CSS. A mismatch produces wrong heights silently.

### 4. Choose hooks for each feature

| Feature | Hook | Key detail |
|---|---|---|
| Row height measurement | `useMeasure` | Always required |
| Virtualized scroll | `useVirtualization` | Use `offsets[i]` as CSS `top`, `totalHeight` as spacer height |
| Column/row resize | `useResizable` | Returns `getColHandleProps`, `getRowHandleProps`, `previewDragState` |
| Resize ghost preview | `useResizePreview` | Pass `prepared` + `previewDragState` — runs only `layout()` during drag |
| Scroll anchor on resize | `useScrollAnchor` | Keeps viewport row stable during column resize |
| Shrink column to content | `useShrinkWrap` | Pass `prepared` from `useMeasure` — never re-measures |
| Container-driven column scale | `useExpandable` | ResizeObserver → proportional column widths |
| Drag-to-reorder | `useDraggable` | Rows and/or columns |
| Sort | `useSortable` | Sort state + sorted rows |
| Column visibility + sort | `useColumnControls` | Combines visibility toggles and sort |
| Inline cell editing | `useEditable` | Debounces `prepare()`, runs `layout()` per keystroke |
| Sticky columns | `useStickyColumns` | Horizontal scroll with frozen left columns |
| Infinite scroll | `useInfiniteScroll` | Bottom-of-viewport detection |
| Canvas cell rendering | `useCanvasCell` | Custom draw functions per cell |
| Full-text search | `useSearch` | Returns highlight rects per cell |
| Dynamic font size | `useDynamicFont` | Scales font to fit cell width |
| Export to PNG | `useExportCanvas` | Table → Canvas → Blob |
| Cell notes overlay | `useCellNotes` | Floating notes per cell |
| Media cells | `useMediaCells` | Image/video auto-height from aspect ratio |

### 5. Reference implementations

This skill ships three self-contained reference files. Read them before
implementing a table — they show the correct hook composition and memoization
boundaries:

- `references/useMeasure.ts` — `useMeasure` + `useVirtualization` source
- `references/VirtualizedTable.tsx` — virtualized scroll with accurate heights
- `references/ResizableTable.tsx` — column resize + shrink-wrap on double-click
- `references/EditableTable.tsx` — inline editing with per-keystroke height updates

### 6. Apply row heights

```tsx
// HTML table
<tr style={{ height: rowHeights[i] }}>

// Virtualized (absolutely positioned rows)
<div style={{ position: 'absolute', top: offsets[rowIndex], height: rowHeights[rowIndex] }}>
```

For virtualized tables, use `computeOffsets(rowHeights)` for scroll positions
and `computeTotalHeight(rowHeights)` for the spacer div.

### 7. Output checklist

- [ ] `useMeasure` is called before any layout-dependent hook
- [ ] `prepared` is passed to downstream hooks — `prepareWithSegments` is never called twice for the same data
- [ ] `font` string matches the CSS font rendered in the browser
- [ ] Row heights are applied via inline `style`, not CSS class
- [ ] Virtualized tables use `computeOffsets` for `top` positions
- [ ] Only hooks the table actually uses are imported
