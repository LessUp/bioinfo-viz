import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { ReadAlignment } from '../types/events'
import type { VariantItem } from './VariantPanel'

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

function useResize(elRef: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 300, h: 200 })
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [elRef])
  return size
}

export default function AlignmentCanvas({ region, reads, filters, variants = [] }: { region: { chrom: string; start: number; end: number }; reads: ReadAlignment[]; filters: { minMapq: number; showMismatches: boolean; showIndels: boolean; showVariants?: boolean }; variants?: VariantItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useResize(wrapRef)
  const [hover, setHover] = useState<{ x: number; y: number; r?: ReadAlignment } | null>(null)

  const filteredReads = useMemo(() => reads.filter(r => r.mapq >= filters.minMapq), [reads, filters.minMapq])

  const displayReads = useMemo(() => {
    if (w <= 0) return filteredReads
    const span = Math.max(1, region.end - region.start)
    const maxReads = Math.max(1000, Math.floor(w * 3))
    if (filteredReads.length <= maxReads) return filteredReads
    const stride = Math.ceil(filteredReads.length / maxReads)
    const sorted = [...filteredReads].sort((a, b) => a.pos - b.pos)
    const sampled: ReadAlignment[] = []
    for (let i = 0; i < sorted.length; i += stride) sampled.push(sorted[i])
    return sampled
  }, [filteredReads, w, region.start, region.end])

  const lanes = useMemo(() => {
    const sorted = [...displayReads].sort((a, b) => a.pos - b.pos)
    const ends: number[] = []
    const laneIndex: number[] = new Array(sorted.length)
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i]
      const len = cigarAlignedLength(r.cigar)
      const rEnd = r.pos + len
      let assigned = 0
      for (let l = 0; l < ends.length; l++) {
        if (r.pos >= ends[l] + 3) { assigned = l; ends[l] = rEnd; break }
        if (l === ends.length - 1) assigned = ends.length
      }
      if (ends.length === 0 || r.pos < ends[assigned] + 3) { ends.push(rEnd); assigned = ends.length - 1 }
      laneIndex[i] = assigned
    }
    return { sorted, laneIndex, laneCount: ends.length }
  }, [displayReads])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(w * dpr))
    canvas.height = Math.max(1, Math.floor(h * dpr))
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    // background grid
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, w, h)

    const span = region.end - region.start
    const xScale = (pos: number) => (pos - region.start) / span * w

    // reference axis
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 16)
    ctx.lineTo(w, 16)
    ctx.stroke()

    const laneH = 12
    const gap = 3

    // draw reads
    for (let i = 0; i < lanes.sorted.length; i++) {
      const r = lanes.sorted[i]
      const lane = lanes.laneIndex[i]
      const y = 24 + lane * (laneH + gap)
      const len = cigarAlignedLength(r.cigar)
      const x1 = Math.max(0, xScale(r.pos))
      const x2 = Math.min(w, xScale(r.pos + len))
      // bar
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(x1, y, Math.max(1, x2 - x1), laneH)
      // strand notch
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      if (r.strand === '+') ctx.fillRect(x1, y, 2, laneH)
      else ctx.fillRect(x2 - 2, y, 2, laneH)
      if (filters.showMismatches) {
        // mismatches
        ctx.fillStyle = '#ef4444'
        r.mismatches?.forEach((m: { pos: number; ref: string; alt: string }) => {
          const mx = xScale(m.pos)
          if (mx >= 0 && mx <= w) ctx.fillRect(mx, y, 2, laneH)
        })
      }
      if (filters.showIndels) {
        // insertions
        ctx.fillStyle = '#22c55e'
        r.insertions?.forEach((ins: { pos: number; len: number }) => {
          const ix = xScale(ins.pos)
          if (ix >= 0 && ix <= w) ctx.fillRect(ix, y - 2, 2, laneH + 4)
        })
        // deletions
        ctx.fillStyle = '#f59e0b'
        r.deletions?.forEach((del: { pos: number; len: number }) => {
          const dx1 = xScale(del.pos)
          const dx2 = xScale(del.pos + del.len)
          ctx.fillRect(dx1, y + laneH/2 - 1, Math.max(1, dx2 - dx1), 2)
        })
      }
    }

    // variant highlights
    if (filters.showVariants) {
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1
      for (const v of variants) {
        if (v.chrom !== region.chrom) continue
        if (v.pos < region.start || v.pos > region.end) continue
        const vx = xScale(v.pos)
        ctx.beginPath()
        ctx.moveTo(vx, 18)
        ctx.lineTo(vx, h - 8)
        ctx.stroke()
      }
    }

    // axes labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
    ctx.fillText(`${region.chrom}:${region.start.toLocaleString()}-${region.end.toLocaleString()}`, 6, 12)
  }, [w, h, region, lanes, filters.showMismatches, filters.showIndels, filters.showVariants, variants])

  const onMove: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const span = Math.max(1, region.end - region.start)
    const gp = region.start + (x / Math.max(1, canvas.clientWidth)) * span
    const laneH = 8
    const gap = 4
    const lane = Math.floor((y - 24) / (laneH + gap))
    if (lane < 0 || lane >= lanes.laneCount) { setHover({ x, y, r: undefined }); return }
    let found: ReadAlignment | undefined
    for (let i = 0; i < lanes.sorted.length; i++) {
      if (lanes.laneIndex[i] !== lane) continue
      const r = lanes.sorted[i]
      const len = cigarAlignedLength(r.cigar)
      if (gp >= r.pos && gp <= r.pos + len) { found = r; break }
    }
    setHover({ x, y, r: found })
  }

  const onLeave: React.MouseEventHandler<HTMLCanvasElement> = () => setHover(null)

  return (
    <div ref={wrapRef} className="relative w-full h-60 card p-2">
      <canvas ref={canvasRef} className="w-full h-full" onMouseMove={onMove} onMouseLeave={onLeave} />
      {hover?.r && (
        <div className="absolute bg-neutral-900/95 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 pointer-events-none" style={{ left: Math.min(hover.x + 12, Math.max(0, (w || 0) - 160)), top: Math.min(hover.y + 12, Math.max(0, (h || 0) - 80)) }}>
          <div>pos {hover.r.pos.toLocaleString()} · MAPQ {hover.r.mapq}</div>
          <div>cigar {hover.r.cigar}</div>
          <div>mm {(hover.r.mismatches?.length ?? 0)} · ins {(hover.r.insertions?.length ?? 0)} · del {(hover.r.deletions?.length ?? 0)}</div>
        </div>
      )}
    </div>
  )
}
