# pretext-tables

A showcase of React table components built on [`@chenglou/pretext`](https://github.com/chenglou/pretext) — a library that measures text using the Canvas font engine before anything is rendered, eliminating layout thrash entirely.

## The problem

Standard HTML tables let the browser figure out cell heights at paint time. With dynamic content, wrapping text, or large datasets, this means repeated layout recalculations — reflows — that stack up fast. Virtualized tables work around this with fixed row heights or estimated heights, which introduces scroll jitter and layout jumps.

## The approach

`pretext` separates text measurement into two phases:

- **`prepare()`** — measures text once via Canvas (~19 ms for 500 texts), font-accurate, no DOM
- **`layout()`** — pure arithmetic line-breaking at any width (~0.09 ms per text)

Row heights are computed before the first render. Resize a column and heights recalculate instantly — no reflow, no jitter.

## What's in the showcase

Eight table variants, each demonstrating a different use case:

| Component | What it shows |
|---|---|
| `BasicTable` | Static table with pretext-measured row heights |
| `VirtualizedTable` | Virtualized scroll with accurate per-row heights |
| `ResizableTable` | Column and row resize with scroll anchor |
| `ExpandableTable` | Proportional column scaling on container resize |
| `DraggableTable` | Drag-to-reorder rows and columns |
| `ColumnControlsTable` | Column visibility toggles and click-to-sort |
| `SpanningTable` | Multi-row spanning with aligned SVG chart |
| `GridTable` | CSS Grid layout with sticky headers |

And a set of composable hooks covering virtualization, resize, drag, sort, inline editing, sticky columns, canvas cells, search highlighting, export to PNG, and more.

## Run locally

```sh
bun install
bun run dev
```

## Credits

Built on [`@chenglou/pretext`](https://github.com/chenglou/pretext) by [@_chenglou](https://twitter.com/_chenglou).
