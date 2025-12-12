import React, { useEffect, useMemo, useRef, useState } from 'react'
import Timeline from './components/Timeline'
import AlignmentCanvas from './components/AlignmentCanvas'
import CoverageTrack from './components/CoverageTrack'
import MetricCards from './components/MetricCards'
import LogPanel, { LogItem } from './components/LogPanel'
import ControlPanel from './components/ControlPanel'
import TeachingPanel from './components/TeachingPanel'
import { useAppStore } from './store/useAppStore'
import VariantPanel, { type VariantItem } from './components/VariantPanel'
import type {
  AlignChunkEvent,
  CoverageUpdateEvent,
  PipelineStepName,
  PipelineStatus,
  ReadAlignment,
  StreamEvent,
} from './types/events'
import { startStream } from './streams/streamClient'
import { alignedLengthFromCigar } from './utils/cigar'

type Step = { name: PipelineStepName; status: PipelineStatus; progress?: number }

export default function App() {
  const jobId = 'job-demo-001'
  const { region, filters, connection } = useAppStore()

  const stepNames: PipelineStepName[] = [
    'qc',
    'index',
    'align',
    'sort',
    'dedup',
    'variant',
    'annotate',
  ]
  const [steps, setSteps] = useState<Step[]>(
    stepNames.map((n) => ({ name: n, status: 'queued', progress: 0 }))
  )
  const [reads, setReads] = useState<ReadAlignment[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [binsMap, setBinsMap] = useState<Map<number, number>>(new Map())
  const [binSize, setBinSize] = useState<number>(50)
  const [variants, setVariants] = useState<VariantItem[]>([])

  const [processedReads, setProcessedReads] = useState(0)
  const [qps, setQps] = useState(0)
  const [avgCoverage, setAvgCoverage] = useState(0)
  const [mismatchRate, setMismatchRate] = useState(0)

  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const w = new Worker(new URL('./workers/coverageWorker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = w
    w.onmessage = (ev: MessageEvent) => {
      const data = ev.data as any
      if (data?.type === 'coverage.agg') {
        setBinSize(data.binSize as number)
        setBinsMap(new Map<number, number>(data.pairs as [number, number][]))
        setAvgCoverage(data.avg as number)
      }
    }
    return () => {
      w.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    let totalAligned = 0
    let totalMismatches = 0
    let stopFn: (() => void) | null = null

    workerRef.current?.postMessage({ type: 'coverage.reset' })
    setBinsMap(new Map())
    setBinSize(50)
    setAvgCoverage(0)
    setReads([])
    setVariants([])
    setLogs([])
    setProcessedReads(0)
    setQps(0)
    setMismatchRate(0)

    if (connection.connected) {
      stopFn = startStream(
        { sourceType: connection.sourceType, url: connection.url, jobId, region },
        (e: StreamEvent) => {
          if (e.type === 'pipeline.step') {
            setSteps((prev: Step[]) =>
              prev.map((s: Step) =>
                s.name === e.payload.name
                  ? { ...s, status: e.payload.status, progress: e.payload.progress ?? s.progress }
                  : s
              )
            )
            if (e.payload.metrics?.qps != null) setQps(e.payload.metrics.qps)
          } else if (e.type === 'align.chunk') {
            const ev = e as AlignChunkEvent
            setReads((prev: ReadAlignment[]) => {
              const next = [...prev, ...ev.payload.reads]
              const cap = 800
              return next.length > cap ? next.slice(next.length - cap) : next
            })
            setProcessedReads((v: number) => v + ev.payload.reads.length)
            // mismatch rate（按读段错配数/对齐碱基数近似）
            for (const r of ev.payload.reads) {
              const mism = r.mismatches?.length ?? 0
              const len = alignedLengthFromCigar(r.cigar)
              totalMismatches += mism
              totalAligned += len
            }
            if (totalAligned > 0) setMismatchRate(totalMismatches / totalAligned)
          } else if (e.type === 'coverage.update') {
            const ev = e as CoverageUpdateEvent
            workerRef.current?.postMessage({ type: 'coverage.update', payload: ev.payload })
          } else if (e.type === 'variant.called') {
            const v = (e as any).payload as VariantItem
            setVariants((prev) => {
              const next = [v, ...prev]
              return next.slice(0, 50)
            })
          } else if (e.type === 'log.line') {
            setLogs((prev: LogItem[]) => [
              ...prev,
              { ts: e.ts, level: e.payload.level, msg: e.payload.msg },
            ])
          } else if (e.type === 'error') {
            setLogs((prev: LogItem[]) => [
              ...prev,
              { ts: e.ts, level: 'error', msg: e.payload.msg },
            ])
          }
        }
      )
    }
    return () => {
      if (stopFn) stopFn()
    }
    // re-connect on connection options change
  }, [
    connection.connected,
    connection.sourceType,
    connection.url,
    region.chrom,
    region.start,
    region.end,
  ])

  const bins = useMemo((): { start: number; cov: number }[] => {
    const arr: { start: number; cov: number }[] = []
    for (const [start, cov] of binsMap.entries()) arr.push({ start, cov })
    arr.sort((a, b) => a.start - b.start)
    return arr
  }, [binsMap])

  const metrics = { processedReads, qps, avgCoverage, mismatchRate }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold">基因比对动态可视化</div>
          <div className="text-neutral-400 text-sm mt-1">
            任务 {jobId} · 区域 {region.chrom}:{region.start}-{region.end}
          </div>
        </div>
      </div>

      <ControlPanel />
      <TeachingPanel />

      <Timeline steps={steps} />

      <MetricCards metrics={metrics} />
      <VariantPanel variants={variants} />

      <AlignmentCanvas region={region} reads={reads} filters={filters} variants={variants} />

      <CoverageTrack region={region} binSize={binSize} bins={bins} />

      <LogPanel logs={logs} />
    </div>
  )
}
