import type { StreamEvent, PipelineStepName, ReadAlignment } from '../types/events'

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function choice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function makeCigar(): string {
  const m1 = randInt(20, 60)
  const hasIns = Math.random() < 0.2
  const hasDel = Math.random() < 0.15
  const m2 = randInt(20, 60)
  let cigar = `${m1}M`
  if (hasIns) cigar += `${randInt(1, 3)}I`
  if (hasDel) cigar += `${randInt(1, 3)}D`
  cigar += `${m2}M`
  return cigar
}

function cigarAlignedLength(cigar: string): number {
  const re = /(\d+)([MIDNSHP=X])/g
  let len = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(cigar))) {
    const n = parseInt(m[1], 10)
    const op = m[2]
    if (op === 'M' || op === '=' || op === 'X' || op === 'D' || op === 'N') len += n
  }
  return len
}

export function startMockStream(jobId: string, onEvent: (e: StreamEvent) => void, regionArg?: { chrom: string; start: number; end: number }) {
  const steps: PipelineStepName[] = ['qc','index','align','sort','dedup','variant','annotate']
  let current = 0
  let progress = 0
  let alignTimer: any = null
  const region = regionArg ?? { chrom: 'chr1', start: 100_200, end: 100_800 }
  const binSize = 50
  const now = () => Date.now()

  function emit(e: StreamEvent) { onEvent(e) }

  function startStep(name: PipelineStepName) {
    progress = 0
    emit({ type: 'pipeline.step', jobId, ts: now(), payload: { name, status: 'started', progress: 0 } })
    if (name === 'align') {
      alignTimer = setInterval(() => {
        // generate reads chunk
        const reads: ReadAlignment[] = Array.from({ length: 20 }, (_, i) => {
          const pos = randInt(region.start, region.end - 80)
          const cigar = makeCigar()
          const mmCount = Math.random() < 0.6 ? randInt(0, 3) : 0
          const mismatches = Array.from({ length: mmCount }, () => ({ pos: pos + randInt(0, Math.min(120, region.end - pos)), ref: choice(['A','C','G','T']), alt: choice(['A','C','G','T']) }))
          const insCount = Math.random() < 0.2 ? 1 : 0
          const delCount = Math.random() < 0.15 ? 1 : 0
          return {
            id: `r_${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`,
            pos,
            mapq: randInt(20, 60),
            cigar,
            strand: Math.random() < 0.5 ? '+' : '-',
            mismatches,
            insertions: insCount ? [{ pos: pos + randInt(5, 40), len: randInt(1,3) }] : [],
            deletions: delCount ? [{ pos: pos + randInt(10, 50), len: randInt(1,3) }] : [],
            score: randInt(100, 180)
          }
        })
        emit({ type: 'align.chunk', jobId, ts: now(), payload: { chrom: region.chrom, start: region.start, end: region.end, reads } })
        // coverage update based on reads
        const bins: { start: number; cov: number }[] = []
        for (const r of reads) {
          const len = cigarAlignedLength(r.cigar)
          const rStart = r.pos
          const rEnd = r.pos + len
          for (let s = Math.floor(rStart / binSize) * binSize; s <= rEnd; s += binSize) {
            bins.push({ start: s, cov: 1 })
          }
        }
        emit({ type: 'coverage.update', jobId, ts: now(), payload: { chrom: region.chrom, binSize, bins } })
        // occasionally emit a variant call
        if (Math.random() < 0.25) {
          const withMM = reads.filter(r => (r.mismatches?.length ?? 0) > 0)
          const pick = withMM.length ? choice(withMM) : choice(reads)
          const pos = pick.mismatches?.[0]?.pos ?? (pick.pos + randInt(5, 60))
          const ref = choice(['A','C','G','T'])
          const alt = choice(['A','C','G','T'].filter(x => x !== ref))
          emit({ type: 'variant.called', jobId, ts: now(), payload: { chrom: region.chrom, pos, ref, alt, type: 'SNP', dp: randInt(10, 80), af: Math.round((0.2 + Math.random()*0.6)*100)/100 } as any })
        }
        // logs
        if (Math.random() < 0.3) emit({ type: 'log.line', jobId, ts: now(), payload: { level: 'info', msg: `对齐批次完成，reads=${reads.length}` } })
      }, 300)
    }
  }

  function finishStep(name: PipelineStepName) {
    emit({ type: 'pipeline.step', jobId, ts: now(), payload: { name, status: 'finished', progress: 1 } })
    if (name === 'align' && alignTimer) { clearInterval(alignTimer); alignTimer = null }
  }

  // master tick to advance steps
  const stepTick = setInterval(() => {
    const name = steps[current]
    if (progress === 0) startStep(name)
    progress = Math.min(1, progress + (name === 'align' ? 0.06 : 0.12))
    emit({ type: 'pipeline.step', jobId, ts: now(), payload: { name, status: 'progress', progress, metrics: name==='align' ? { qps: 800 + randInt(-120, 180), latencyMs: 20 + randInt(0, 30) } : undefined } })
    if (progress >= 1) {
      finishStep(name)
      current++
      if (current >= steps.length) {
        clearInterval(stepTick)
        emit({ type: 'log.line', jobId, ts: now(), payload: { level: 'info', msg: '任务完成' } })
      }
    }
  }, 800)

  return () => {
    clearInterval(stepTick)
    if (alignTimer) clearInterval(alignTimer)
  }
}
