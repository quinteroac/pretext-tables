// Row type used by BasicTable
export type Row = {
  id: string
  cells: string[]
}

// Column definition used by ResizableTable
export interface Column {
  key: string
  header: string
  /** Explicit pixel width. Omit or set to 0 to auto-fill from container. */
  width?: number
}

// Row type used by ResizableTable (key-value record)
export type DataRecord = Record<string, string>
