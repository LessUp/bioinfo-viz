import React from 'react'

export default function MetricCards({ metrics }: { metrics: { processedReads: number; qps: number; avgCoverage: number; mismatchRate: number } }) {
  const items = [
    { label: '已处理Reads', value: metrics.processedReads.toLocaleString() },
    { label: '当前QPS', value: Math.round(metrics.qps).toLocaleString() },
    { label: '平均覆盖', value: metrics.avgCoverage.toFixed(1) },
    { label: '错配率', value: (metrics.mismatchRate * 100).toFixed(2) + '%' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="card p-3">
          <div className="text-xs text-neutral-400">{it.label}</div>
          <div className="text-xl mt-1">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
