import { ResizableTable } from './tables'
import type { Column, TableRow } from './shared/types'

// ── Column definitions ────────────────────────────────────────────────────────
// Widths are intentionally varied to showcase pretext's height computation:
// narrow columns will wrap more aggressively, driving taller rows.

const COLUMNS: Column[] = [
  { key: 'index', header: '#',        width: 48  },
  { key: 'title', header: 'Title',    width: 220 },
  { key: 'body',  header: 'Content',  width: 360 },
  { key: 'meta',  header: 'Context',  width: 180 },
]

// ── Auto-fill columns (US-003) ────────────────────────────────────────────────
// All columns omit `width` (treated as 0 / auto). The table distributes the
// container width evenly across all columns on first mount.

const AUTO_COLUMNS: Column[] = [
  { key: 'index', header: '#'       },
  { key: 'title', header: 'Title'   },
  { key: 'body',  header: 'Content' },
  { key: 'meta',  header: 'Context' },
]

// ── Sample data ────────────────────────────────────────────────────────────────
// Rows deliberately mix very short, moderate, and very long text to exercise
// the height-computation path across all extremes.

const ROWS: TableRow[] = [
  {
    id:    '1',
    index: '1',
    title: 'Brief',
    body:  'Short.',
    meta:  'Minimal content.',
  },
  {
    id:    '2',
    index: '2',
    title: 'The Quiet Revolution in Data Journalism',
    body:  'Over the past decade, newsrooms have increasingly turned to structured data to tell stories that would otherwise require hundreds of column inches. The shift has not been seamless: reporters trained in narrative prose often find data tables cold, while engineers find narrative imprecise.',
    meta:  'Long-form analysis, 2024',
  },
  {
    id:    '3',
    index: '3',
    title: 'Typography',
    body:  'A typeface is not merely a visual choice — it encodes the rhythm of reading. Serif faces slow the eye just enough to encourage close reading; sans-serif faces accelerate scanning. Neither is superior in absolute terms.',
    meta:  'Design notes',
  },
  {
    id:    '4',
    index: '4',
    title: 'VeryLongSingleWordThatCannotBreakNaturallyAndShouldStillFitWithinItsCell',
    body:  'Supercalifragilisticexpialidocious is one example, but real codebases contain identifiers like transformApplicationStateWithMiddleware that must be handled gracefully without overflow.',
    meta:  'Edge-case: unbreakable tokens',
  },
  {
    id:    '5',
    index: '5',
    title: 'Null / empty',
    body:  '',
    meta:  '',
  },
  {
    id:    '6',
    index: '6',
    title: 'Measurement without the DOM',
    body:  'pretext replaces getBoundingClientRect for text sizing. Every cell height you see in this table was computed before the first pixel was painted — no layout thrash, no reflow, no surprises on slow devices.',
    meta:  'pretext demo',
  },
  {
    id:    '7',
    index: '7',
    title: 'Three-line cell',
    body:  'Line one of three.\nLine two adds context.\nLine three concludes.',
    meta:  'Multi-line example',
  },
  {
    id:    '8',
    index: '8',
    title: 'International text — 国際化テスト',
    body:  '日本語のテキストは、単語の境界がスペースで区切られていないため、行の折り返しが英語とは異なるルールに従います。pretext は Intl.Segmenter を使用してこれを正しく処理します。',
    meta:  'CJK wrap test',
  },
]

export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">pretext-tables</h1>
        <p className="app-subtitle">
          Cell heights computed by{' '}
          <code>@chenglou/pretext</code> before first paint —
          no DOM measurement, no reflows.
        </p>
      </header>

      <section className="app-demo">
        <ResizableTable columns={COLUMNS} rows={ROWS} />
      </section>

      <section className="app-demo">
        <h2 className="app-section-label">Auto-fill columns (US-003)</h2>
        <p className="app-section-desc">
          All columns have no explicit width — they distribute the container
          width evenly on load. Resize the browser window to see the initial
          distribution recalculate on remount.
        </p>
        <ResizableTable columns={AUTO_COLUMNS} rows={ROWS} />
      </section>

      <section className="app-demo app-demo--empty">
        <h2 className="app-section-label">Empty state</h2>
        <ResizableTable columns={COLUMNS} rows={[]} />
      </section>

      <footer className="app-footer">
        <p>US-001 · US-002 · US-003 · ResizableTable · auto-computed cell heights</p>
      </footer>
    </main>
  )
}
