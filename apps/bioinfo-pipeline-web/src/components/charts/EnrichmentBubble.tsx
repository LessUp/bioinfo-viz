'use client'

import React from 'react'
import EChart from '@/components/echarts/EChart'
import { seededArray } from '@/lib/seed'
import type { EChartsOption } from 'echarts'

export default function EnrichmentBubble({
  seed = 'enrich',
  n = 12,
}: {
  seed?: string
  n?: number
}) {
  const names = Array.from({ length: n }, (_, i) => `Pathway ${i + 1}`)
  const score = seededArray(`${seed}-s`, n, 1.2, 3.5)
  const genes = seededArray(`${seed}-g`, n, 5, 60)
  const fdr = seededArray(`${seed}-f`, n, 0.0001, 0.2)

  const data = names.map((name, i) => [score[i], genes[i], fdr[i], name])

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] : params
        const rec = first as unknown as Record<string, unknown>
        const raw = rec.data
        const d = Array.isArray(raw) ? raw : []

        const s = Number(d[0])
        const g = Number(d[1])
        const q = Number(d[2])
        const name = String(d[3] ?? '')
        return `${name}<br/>Score: ${s.toFixed(2)}<br/>Genes: ${g.toFixed(0)}<br/>FDR: ${q.toExponential(2)}`
      },
    },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { name: 'Enrichment score', type: 'value' },
    yAxis: { name: '# Genes', type: 'value' },
    series: [
      {
        type: 'scatter',
        symbolSize: (val) => {
          const q = Number(val[2])
          return Math.max(8, Math.min(40, (1 - q) * 40))
        },
        data,
        itemStyle: {
          color: '#22c55e',
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
  }

  return <EChart option={option} />
}
