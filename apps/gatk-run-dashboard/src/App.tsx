import { useEffect } from 'react'
import { useRunStore } from './store/runStore'
import { RunHeader } from './components/RunHeader'
import { Filters } from './components/Filters'
import { DAGView } from './components/DAGView'
import { TimelineView } from './components/TimelineView'
import { StepDrawer } from './components/StepDrawer'

export default function App() {
  const view = useRunStore(s => s.view)
  const loadMock = useRunStore(s => s.loadFromMock)
  const run = useRunStore(s => s.run)
  const autoRefresh = useRunStore(s => s.autoRefresh)
  const autoRefreshInterval = useRunStore(s => s.autoRefreshInterval)
  const refreshOnce = useRunStore(s => s.refreshOnce)

  useEffect(() => {
    loadMock()
  }, [loadMock])

  useEffect(() => {
    const isTerminal = (status?: string) => status === 'Succeeded' || status === 'Failed' || status === 'Aborted'
    if (!autoRefresh || !run || isTerminal(run.status)) return
    const id = setInterval(() => {
      refreshOnce()
    }, Math.max(1000, autoRefreshInterval))
    return () => clearInterval(id)
  }, [autoRefresh, autoRefreshInterval, run?.id, run?.status, refreshOnce])

  return (
    <div className="h-full flex flex-col">
      <RunHeader />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 p-3 overflow-auto">
          <Filters />
        </aside>
        <main className="flex-1 overflow-hidden">
          {view === 'dag' ? (
            <div id="dag-container" className="h-full"><DAGView /></div>
          ) : (
            <div id="timeline-container" className="h-full"><TimelineView /></div>
          )}
        </main>
        <StepDrawer />
      </div>
    </div>
  )
}
