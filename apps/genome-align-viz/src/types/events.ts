export type PipelineStatus = 'queued' | 'started' | 'progress' | 'finished' | 'failed'
export type PipelineStepName = 'qc' | 'index' | 'align' | 'sort' | 'dedup' | 'variant' | 'annotate'

export interface PipelineStepEvent {
  type: 'pipeline.step'
  jobId: string
  ts: number
  payload: {
    name: PipelineStepName
    status: PipelineStatus
    progress?: number
    metrics?: { qps?: number; latencyMs?: number }
  }
}

export interface ReadAlignment {
  id: string
  pos: number
  mapq: number
  cigar: string
  strand: '+' | '-'
  mismatches?: { pos: number; ref: string; alt: string }[]
  insertions?: { pos: number; len: number }[]
  deletions?: { pos: number; len: number }[]
  score?: number
}

export interface AlignChunkEvent {
  type: 'align.chunk'
  jobId: string
  ts: number
  payload: {
    chrom: string
    start: number
    end: number
    reads: ReadAlignment[]
  }
}

export interface CoverageUpdateEvent {
  type: 'coverage.update'
  jobId: string
  ts: number
  payload: {
    chrom: string
    binSize: number
    bins: { start: number; cov: number }[]
  }
}

export interface VariantCalledEvent {
  type: 'variant.called'
  jobId: string
  ts: number
  payload: {
    chrom: string
    pos: number
    ref: string
    alt: string
    type: 'SNP' | 'INS' | 'DEL'
    dp: number
    af: number
  }
}

export interface LogEvent {
  type: 'log.line'
  jobId: string
  ts: number
  payload: { level: 'info' | 'warn' | 'error'; msg: string }
}

export interface ErrorEvent {
  type: 'error'
  jobId: string
  ts: number
  payload: { code: string; msg: string; step?: PipelineStepName }
}

export type StreamEvent =
  | PipelineStepEvent
  | AlignChunkEvent
  | CoverageUpdateEvent
  | VariantCalledEvent
  | LogEvent
  | ErrorEvent
