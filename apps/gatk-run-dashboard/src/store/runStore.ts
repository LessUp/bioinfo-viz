import { create } from 'zustand'
import { exampleRun } from '../mock/exampleRun'
import { fetchCromwellMetadata, normalizeCromwell } from '../adapters/cromwell'

export type RunStatus = 'Queued' | 'Running' | 'Succeeded' | 'Failed' | 'Aborted'
export type Phase = 'Preprocess' | 'VariantCalling' | 'JointGenotyping' | 'Filtering'

export interface Edge { from: string; to: string; label?: string }
export interface Step {
  id: string
  label: string
  fqname?: string
  phase: Phase
  status: RunStatus
  startTime?: string
  endTime?: string
  attempt?: number
  scatterIndex?: number
  metrics?: { cpu?: number; memoryGb?: number; diskGb?: number; cost?: number; durationMs?: number }
  params?: Record<string, any>
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  log?: { stdoutUrl?: string; stderrUrl?: string }
  messages?: string[]
}
export interface Run {
  id: string
  name: string
  pipeline: 'Germline' | 'Somatic' | 'RNA'
  createdAt: string
  updatedAt?: string
  status: RunStatus
  stats?: { totalSteps: number; succeeded: number; failed: number; running: number; durationMs?: number }
  steps: Step[]
  edges: Edge[]
}

type View = 'dag' | 'timeline'

interface RunState {
  run: Run | null
  view: View
  selectedStepId: string | null
  autoRefresh: boolean
  autoRefreshInterval: number
  searchText: string
  statusFilter: RunStatus | 'All'
  loading?: boolean
  error?: string | null
  lastCromwell?: { baseUrl: string; workflowId: string } | null
  groupScatter: boolean
  groupSubWorkflows: boolean
  authEnabled: boolean
  authHeaderKey: string
  authHeaderValue: string
  timelineExporter?: (() => void) | null

  loadFromMock: () => void
  loadFromRun: (run: Run) => void
  loadFromCromwell: (baseUrl: string, workflowId: string) => Promise<void>
  setView: (v: View) => void
  selectStep: (id: string | null) => void
  setSearchText: (q: string) => void
  setStatusFilter: (s: RunStatus | 'All') => void
  setAutoRefresh: (v: boolean) => void
  setAutoRefreshInterval: (ms: number) => void
  refreshOnce: () => Promise<void>
  setGroupScatter: (v: boolean) => void
  setGroupSubWorkflows: (v: boolean) => void
  setAuthEnabled: (v: boolean) => void
  setAuthHeaderKey: (k: string) => void
  setAuthHeaderValue: (v: string) => void
  setTimelineExporter: (fn: (() => void) | null) => void
  timelineExport: () => void
}

export const useRunStore = create<RunState>((set, get) => ({
  run: null,
  view: 'dag',
  selectedStepId: null,
  autoRefresh: true,
  autoRefreshInterval: 7000,
  searchText: '',
  statusFilter: 'All',
  loading: false,
  error: null,
  lastCromwell: null,
  groupScatter: false,
  groupSubWorkflows: false,
  authEnabled: false,
  authHeaderKey: 'Authorization',
  authHeaderValue: '',
  timelineExporter: null,

  loadFromMock: () => set(() => ({ run: exampleRun })),
  loadFromRun: (run: Run) => set(() => ({ run })),
  loadFromCromwell: async (baseUrl: string, workflowId: string) => {
    set(() => ({ loading: true, error: null }))
    try {
      const { authEnabled, authHeaderKey, authHeaderValue } = get()
      const headers = authEnabled && authHeaderKey ? { [authHeaderKey]: authHeaderValue } as Record<string, string> : undefined
      const meta = await fetchCromwellMetadata(baseUrl, workflowId, headers)
      const run = normalizeCromwell(meta)
      set(() => ({ run, loading: false, lastCromwell: { baseUrl, workflowId } }))
    } catch (e: any) {
      set(() => ({ loading: false, error: e?.message ?? String(e) }))
    }
  },
  setView: (v) => set(() => ({ view: v })),
  selectStep: (id) => set(() => ({ selectedStepId: id })),
  setSearchText: (q) => set(() => ({ searchText: q })),
  setStatusFilter: (s) => set(() => ({ statusFilter: s })),
  setAutoRefresh: (v) => set(() => ({ autoRefresh: v })),
  setAutoRefreshInterval: (ms) => set(() => ({ autoRefreshInterval: Math.max(1000, ms) })),
  refreshOnce: async () => {
    const last = get().lastCromwell
    if (!last) return
    try {
      const { authEnabled, authHeaderKey, authHeaderValue } = get()
      const headers = authEnabled && authHeaderKey ? { [authHeaderKey]: authHeaderValue } as Record<string, string> : undefined
      const meta = await fetchCromwellMetadata(last.baseUrl, last.workflowId, headers)
      const run = normalizeCromwell(meta)
      set(() => ({ run }))
    } catch {
      // 静默失败，保留旧数据
    }
  },
  setGroupScatter: (v) => set(() => ({ groupScatter: v })),
  setGroupSubWorkflows: (v) => set(() => ({ groupSubWorkflows: v })),
  setAuthEnabled: (v) => set(() => ({ authEnabled: v })),
  setAuthHeaderKey: (k) => set(() => ({ authHeaderKey: k })),
  setAuthHeaderValue: (v) => set(() => ({ authHeaderValue: v })),
  setTimelineExporter: (fn) => set(() => ({ timelineExporter: fn })),
  timelineExport: () => { const fn = get().timelineExporter; if (fn) fn() },
}))
