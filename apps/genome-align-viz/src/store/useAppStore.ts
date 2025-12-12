import { create } from 'zustand'
import type { PipelineStepName } from '../types/events'

export type SourceType = 'mock' | 'sse' | 'ws'

export interface Region {
  chrom: string
  start: number
  end: number
}

export interface Filters {
  minMapq: number
  showMismatches: boolean
  showIndels: boolean
  showVariants: boolean
}

interface ConnectionState {
  sourceType: SourceType
  url: string
  connected: boolean
}

interface TeachingState {
  enabled: boolean
}

interface StepState {
  current?: PipelineStepName
}

interface UIState {
  region: Region
  filters: Filters
  connection: ConnectionState
  teaching: TeachingState
  step: StepState

  setRegion: (r: Region) => void
  zoom: (factor: number) => void
  centerOn: (pos: number, span?: number) => void
  setFilters: (p: Partial<Filters>) => void
  setConnection: (p: Partial<ConnectionState>) => void
  connect: () => void
  disconnect: () => void
  setTeaching: (p: Partial<TeachingState>) => void
}

type SetState = (
  partial: Partial<UIState> | ((state: UIState) => Partial<UIState>),
  replace?: boolean
) => void
type GetState = () => UIState

export const useAppStore = create<UIState>((set: SetState, get: GetState) => ({
  region: { chrom: 'chr1', start: 100_200, end: 100_800 },
  filters: { minMapq: 0, showMismatches: true, showIndels: true, showVariants: true },
  connection: { sourceType: 'mock', url: '', connected: true },
  teaching: { enabled: false },
  step: {},

  setRegion: (r: Region) => set({ region: r }),
  zoom: (factor: number) =>
    set((state: UIState) => {
      const span = state.region.end - state.region.start
      const center = state.region.start + span / 2
      const newSpan = Math.max(50, Math.floor(span * factor))
      return {
        region: {
          ...state.region,
          start: Math.floor(center - newSpan / 2),
          end: Math.floor(center + newSpan / 2),
        },
      }
    }),
  centerOn: (pos: number, span?: number) =>
    set((state: UIState) => {
      const curSpan = state.region.end - state.region.start
      const s = Math.max(50, Math.floor(span ?? curSpan))
      const start = Math.max(0, Math.floor(pos - s / 2))
      const end = start + s
      return { region: { ...state.region, start, end } }
    }),
  setFilters: (p: Partial<Filters>) => set((s: UIState) => ({ filters: { ...s.filters, ...p } })),
  setConnection: (p: Partial<ConnectionState>) =>
    set((s: UIState) => ({ connection: { ...s.connection, ...p } })),
  connect: () => set((s: UIState) => ({ connection: { ...s.connection, connected: true } })),
  disconnect: () => set((s: UIState) => ({ connection: { ...s.connection, connected: false } })),
  setTeaching: (p: Partial<TeachingState>) =>
    set((s: UIState) => ({ teaching: { ...s.teaching, ...p } })),
}))
