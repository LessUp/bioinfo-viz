'use client'

import React from 'react'
import EChart from '@/components/echarts/EChart'
import { seededArray } from '@/lib/seed'
import type { EChartsOption } from 'echarts'

export default function CoverageDepthHist({
  seed = 'cov',
  bins = 40,
}: {
  seed?: string
  bins?: number
}) {
  const x = Array.from({ length: bins }, (_, i) => i * 5)
  const base = seededArray(seed, bins, 0, 1).map((v, i) => {
    const u = Math.exp(-((i - bins / 5) ** 2) / (2 * (bins / 8) ** 2))
    return Math.max(0, 50 * u + v * 10)
  })
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 10, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: x, name: 'Depth' },
    yAxis: { type: 'value', name: 'Count' },
    series: [{ type: 'bar', data: base, name: 'Bases' }],
  }
  return <EChart option={option} />
}
