import React from 'react'
import type { PipelineStepName, PipelineStatus } from '../types/events'

type Step = { name: PipelineStepName; status: PipelineStatus; progress?: number }

const labels: Record<PipelineStepName, string> = {
  qc: 'QC', index: '建索引', align: '比对', sort: '排序', dedup: '去重', variant: '变异', annotate: '注释'
}

export default function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div className="w-full flex items-center gap-3">
      {steps.map((s, i) => {
        const color = s.status === 'finished' ? 'bg-green-600' : s.status === 'failed' ? 'bg-red-600' : (s.status === 'started' || s.status === 'progress') ? 'bg-blue-600' : 'bg-neutral-700'
        return (
          <div key={s.name} className="flex-1">
            <div className={`h-2 rounded ${color} relative overflow-hidden`}>
              {(s.status === 'progress' || s.status === 'started') && (
                <div className="absolute left-0 top-0 h-2 bg-blue-400/80" style={{ width: `${Math.round((s.progress ?? 0) * 100)}%` }} />
              )}
            </div>
            <div className="mt-1 text-[11px] text-neutral-300">{i + 1}. {labels[s.name]}</div>
          </div>
        )
      })}
    </div>
  )
}
