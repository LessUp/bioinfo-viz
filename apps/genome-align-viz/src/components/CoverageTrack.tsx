import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export interface Bin { start: number; cov: number }

export default function CoverageTrack({ region, binSize, bins }: { region: { chrom: string; start: number; end: number }; binSize: number; bins: Bin[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { setRegion, centerOn } = useAppStore()
  const [sel, setSel] = useState<{ x0: number; x1: number; dragging: boolean }>({ x0: -1, x1: -1, dragging: false })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.max(1, Math.floor(w * dpr))
    canvas.height = Math.max(1, Math.floor(h * dpr))
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, w, h)

    const span = region.end - region.start
    const xScale = (pos: number) => (pos - region.start) / span * w
    const maxCov = Math.max(1, ...bins.map(b => b.cov))

    ctx.fillStyle = '#4b5563'
    for (const b of bins) {
      const x = xScale(b.start)
      const bw = Math.max(1, (binSize / span) * w)
      const barH = Math.max(1, (b.cov / maxCov) * (h - 4))
      ctx.fillRect(x, h - barH, bw, barH)
    }

    // selection overlay
    if (sel.dragging && sel.x0 >= 0 && sel.x1 >= 0) {
      const x0 = Math.min(sel.x0, sel.x1)
      const x1 = Math.max(sel.x0, sel.x1)
      ctx.fillStyle = 'rgba(59,130,246,0.25)'
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), h)
      ctx.strokeStyle = 'rgba(59,130,246,0.8)'
      ctx.strokeRect(x0 + 0.5, 0.5, Math.max(1, x1 - x0) - 1, h - 1)
    }

    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText('覆盖度', 6, 12)
  }, [region, bins, binSize, sel])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      setSel({ x0: x, x1: x, dragging: true })
    }
    const onMove = (e: PointerEvent) => {
      if (!sel.dragging) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      setSel(s => ({ ...s, x1: x }))
    }
    const onUp = (e: PointerEvent) => {
      if (!sel.dragging) return
      const rect = canvas.getBoundingClientRect()
      const w = canvas.clientWidth
      const x0 = Math.max(0, Math.min(sel.x0, sel.x1))
      const x1 = Math.min(w, Math.max(sel.x0, sel.x1))
      const span = region.end - region.start
      const g0 = Math.floor(region.start + (x0 / w) * span)
      const g1 = Math.floor(region.start + (x1 / w) * span)
      const minSpan = 50
      if (Math.abs(x1 - x0) < 6) {
        const pos = Math.floor(region.start + (x1 / w) * span)
        centerOn(pos)
      } else {
        const s = Math.max(minSpan, g1 - g0)
        const center = Math.floor(g0 + (g1 - g0) / 2)
        const start = Math.max(0, Math.floor(center - s / 2))
        const end = start + s
        setRegion({ ...region, start, end })
      }
      setSel({ x0: -1, x1: -1, dragging: false })
    }
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [region, sel.dragging, centerOn, setRegion])

  return <canvas ref={ref} className="w-full h-28 card p-2 cursor-crosshair select-none" />
}
