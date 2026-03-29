export interface Column {
  key: string
  header: string
  /** Explicit pixel width. Omit or set to 0 to auto-fill from container. */
  width?: number
}

export type Row = Record<string, string>
