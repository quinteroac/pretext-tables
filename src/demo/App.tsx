import { BasicTable, ResizableTable } from '../tables/index.js'
import type { Column, TableRow } from '../shared/types.js'
import './demo.css'

const COLUMNS: Column[] = [
  { key: 'name',       header: 'Name',       width: 200 },
  { key: 'summary',    header: 'Role Summary', width: 300 },
  { key: 'department', header: 'Department', width: 220 },
]

const ROWS: TableRow[] = [
  { id: '1',  name: 'Alice Johnson',   summary: 'Leads the frontend architecture team and is responsible for establishing coding standards across all product surfaces.',                                          department: 'Engineering'       },
  { id: '2',  name: 'Bob Martinez',    summary: 'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.',                                                            department: 'Platform'          },
  { id: '3',  name: 'Carol White',     summary: 'Manages the design system and ensures visual consistency from the component library down to individual page layouts.',                                           department: 'Design'            },
  { id: '4',  name: 'David Kim',       summary: 'Full-stack engineer who primarily owns the billing and subscription management subsystem.',                                                                      department: 'Engineering'       },
  { id: '5',  name: 'Eva Schulz',      summary: 'Data analyst responsible for building dashboards, defining metrics, and running A/B test analyses.',                                                            department: 'Analytics'         },
  { id: '6',  name: 'Frank Okafor',    summary: 'DevOps engineer overseeing CI/CD pipelines, container orchestration, and cloud cost optimisation strategies.',                                                  department: 'Infrastructure'    },
  { id: '7',  name: 'Grace Tanaka',    summary: 'Product manager for the core editor experience, gathering user feedback and shaping the feature roadmap for the next two quarters.',                            department: 'Product'           },
  { id: '8',  name: 'Hiro Nakamura',   summary: 'Security engineer who performs threat modelling and conducts regular penetration tests on all customer-facing services.',                                       department: 'Security'          },
  { id: '9',  name: 'Isabel Costa',    summary: 'Customer success manager who works closely with enterprise clients to ensure smooth onboarding and long-term retention.',                                       department: 'Customer Success'  },
  { id: '10', name: 'James Li',        summary: 'Mobile engineer building the iOS and Android apps; also maintains the React Native component library shared across platforms.',                                  department: 'Mobile'            },
  { id: '11', name: 'Karen Patel',     summary: 'Technical writer who owns all public API documentation, internal runbooks, and the developer-facing changelog.',                                                department: 'Documentation'     },
  { id: '12', name: 'Luis Fernandez',  summary: 'QA lead responsible for test strategy, automation frameworks, and coordinating release sign-off across teams.',                                                 department: 'Quality Assurance' },
]

const RESIZABLE_COLUMNS: Column[] = [
  { key: 'name',       header: 'Name',        width: 200 },
  { key: 'summary',    header: 'Role Summary', width: 300 },
  { key: 'department', header: 'Department',   width: 220 },
]

export function App() {
  return (
    <div className="demo-root">
      <header className="demo-header">
        <h1 className="demo-title">pretext-tables</h1>
        <p className="demo-subtitle">
          Cell heights pre-calculated by{' '}
          <code className="demo-code">@chenglou/pretext</code> — no DOM
          measurement, no layout thrash.
        </p>
      </header>

      <main className="demo-main">
        <section className="demo-section">
          <h2 className="demo-section-title">BasicTable</h2>
          <p className="demo-section-desc">
            Alturas fijas calculadas por pretext al montar. Sin resize.
          </p>
          <div className="demo-table-meta">
            <span className="demo-pill">Name — 200 px</span>
            <span className="demo-pill">Role Summary — 300 px</span>
            <span className="demo-pill">Department — 220 px</span>
          </div>
          <div className="demo-table-wrapper">
            <BasicTable rows={ROWS} columns={COLUMNS} />
          </div>
        </section>

        <section className="demo-section">
          <h2 className="demo-section-title">ResizableTable</h2>
          <p className="demo-section-desc">
            Arrastra los handles del header para redimensionar columnas. Las
            alturas se recalculan via pretext — sin tocar el DOM.
          </p>
          <div className="demo-table-wrapper">
            <ResizableTable rows={ROWS} columns={RESIZABLE_COLUMNS} />
          </div>
        </section>
      </main>
    </div>
  )
}
