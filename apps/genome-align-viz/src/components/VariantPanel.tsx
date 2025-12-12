import React from 'react'
import { useAppStore } from '../store/useAppStore'

export type VariantItem = {
  chrom: string
  pos: number
  ref: string
  alt: string
  type: 'SNP' | 'INS' | 'DEL'
  dp: number
  af: number
}

export default function VariantPanel({ variants }: { variants: VariantItem[] }) {
  const { centerOn, filters } = useAppStore()
  if (!filters.showVariants) return null
  return (
    <div className="card p-3">
      <div className="text-sm text-neutral-300 mb-2">最近变异</div>
      <div className="space-y-1 text-sm max-h-36 overflow-auto">
        {variants.length === 0 && <div className="text-neutral-500">暂无</div>}
        {variants.map((v, i) => (
          <button
            key={i}
            className="flex items-center justify-between w-full text-left hover:bg-neutral-800/60 px-2 py-1 rounded"
            onClick={() => centerOn(v.pos)}
          >
            <div className="text-neutral-200">
              {v.chrom}:{v.pos.toLocaleString()}
            </div>
            <div className="text-neutral-400">{v.type}</div>
            <div className="text-neutral-300">
              <span className="text-red-300 mr-1">{v.ref}</span>→
              <span className="text-green-300 ml-1">{v.alt}</span>
            </div>
            <div className="text-neutral-400">DP {v.dp}</div>
            <div className="text-neutral-400">AF {(v.af * 100).toFixed(1)}%</div>
          </button>
        ))}
      </div>
    </div>
  )
}
