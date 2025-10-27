// Web Worker: Aggregate coverage bins to reduce main-thread work
export type CoveragePayload = {
  chrom: string
  binSize: number
  bins: { start: number; cov: number }[]
}

let binSize = 50
const coverage = new Map<number, number>()

function handleUpdate(p: CoveragePayload) {
  binSize = p.binSize
  for (const b of p.bins) {
    coverage.set(b.start, (coverage.get(b.start) ?? 0) + b.cov)
  }
  const values = Array.from(coverage.values())
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = values.length ? sum / values.length : 0
  const pairs = Array.from(coverage.entries()) as [number, number][]
  ;(postMessage as any)({ type: 'coverage.agg', binSize, pairs, avg })
}

self.onmessage = (ev: MessageEvent) => {
  const data = ev.data as any
  if (data?.type === 'coverage.update') {
    handleUpdate(data.payload as CoveragePayload)
  }
}

export {}
