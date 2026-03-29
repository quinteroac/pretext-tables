// Unified column definition used by all table components
export interface Column {
  key: string
  header: string
  width?: number
}

// Unified row type used by all table components.
// id is required for React keying; remaining fields are column key → cell value.
export type TableRow = {
  id: string
  [key: string]: string
}
