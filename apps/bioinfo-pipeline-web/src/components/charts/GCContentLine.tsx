"use client";

import React from 'react';
import EChart from '@/components/echarts/EChart';
import { seededArray } from '@/lib/seed';

export default function GCContentLine({ seed = 'gc', series = 2 }: { seed?: string; series?: number }) {
  const x = Array.from({ length: 101 }, (_, i) => i);
  const options = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 30, right: 10, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: x, name: 'GC %' },
    yAxis: { type: 'value', name: 'Density' },
    series: Array.from({ length: series }).map((_, idx) => {
      const arr = seededArray(`${seed}-${idx}`, 101, 0, 1).map((v, i) => {
        const center = 45 + (idx - series / 2) * 3;
        const sigma = 12 + idx;
        const u = Math.exp(-((i - center) ** 2) / (2 * sigma ** 2));
        return Math.max(0, v * 0.2 + u);
      });
      return {
        type: 'line',
        name: `Sample ${idx + 1}`,
        data: arr,
        smooth: true,
        areaStyle: { opacity: 0.08 },
      };
    }),
  } as const;

  return <EChart option={options as any} />;
}
