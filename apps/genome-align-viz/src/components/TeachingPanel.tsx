import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const steps = [
  { key: 'seed', label: '种子匹配 (k-mer/seed)' },
  { key: 'candidate', label: '候选区域定位' },
  { key: 'extend', label: '局部比对扩展 (SW)' },
  { key: 'cigar', label: '形成 CIGAR 与评分' },
]

export default function TeachingPanel() {
  const { teaching } = useAppStore()
  const [idx, setIdx] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!teaching.enabled) return
    const timer = setInterval(() => setIdx((v) => (v + 1) % steps.length), 1200)
    return () => clearInterval(timer)
  }, [teaching.enabled])

  useEffect(() => {
    if (!teaching.enabled) return
    const cvs = canvasRef.current
    if (!cvs) return
    const dpr = devicePixelRatio || 1
    const w = cvs.clientWidth,
      h = cvs.clientHeight
    cvs.width = Math.max(1, Math.floor(w * dpr))
    cvs.height = Math.max(1, Math.floor(h * dpr))
    const ctx = cvs.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px ui-sans-serif, system-ui'

    if (steps[idx].key === 'seed') {
      // reference line
      ctx.strokeStyle = '#374151'
      ctx.beginPath()
      ctx.moveTo(10, 24)
      ctx.lineTo(w - 10, 24)
      ctx.stroke()
      // seeds
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#60a5fa' : '#22c55e'
        ctx.fillRect(20 + i * 40, 16, 24, 16)
      }
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('k-mer seeds', 10, 46)
    } else if (steps[idx].key === 'candidate') {
      ctx.strokeStyle = '#374151'
      ctx.strokeRect(20, 14, w - 40, 22)
      ctx.fillStyle = 'rgba(96,165,250,0.3)'
      ctx.fillRect(80, 14, 140, 22)
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('候选区域', 10, 46)
    } else if (steps[idx].key === 'extend') {
      // SW matrix (sparks)
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 12; x++) {
          const px = 14 + x * 14,
            py = 12 + y * 8
          ctx.fillStyle = x === y || x === y + 1 ? '#60a5fa' : '#1f2937'
          ctx.fillRect(px, py, 10, 6)
        }
      }
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('动态规划路径', 10, 46)
    } else if (steps[idx].key === 'cigar') {
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(20, 18, w - 40, 12)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(120, 18, 2, 12)
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(200, 16, 2, 16)
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(260, 23, 24, 2)
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('CIGAR 示例：35M1I64M', 10, 46)
    }
  }, [idx, teaching.enabled])

  if (!teaching.enabled) return null
  return (
    <div className="card p-3">
      <div className="text-sm text-neutral-300 mb-2">教学模式 · {steps[idx].label}</div>
      <canvas ref={canvasRef} className="w-full h-20" />
    </div>
  )
}
