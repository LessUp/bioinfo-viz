"use client";

import React from 'react';
import EChart from '@/components/echarts/EChart';
import { seededArray } from '@/lib/seed';

export default function EnrichmentBubble({ seed = 'enrich', n = 12 }: { seed?: string; n?: number }) {
  const names = Array.from({ length: n }, (_, i) => `Pathway ${i + 1}`);
  const score = seededArray(`${seed}-s`, n, 1.2, 3.5);
  const genes = seededArray(`${seed}-g`, n, 5, 60);
  const fdr = seededArray(`${seed}-f`, n, 0.0001, 0.2);

  const data = names.map((name, i) => [score[i], genes[i], fdr[i], name]);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter(params: any) {
        const [s, g, q, name] = params.data as [number, number, number, string];
        return `${name}<br/>Score: ${s.toFixed(2)}<br/>Genes: ${g.toFixed(0)}<br/>FDR: ${q.toExponential(2)}`;
      },
    },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { name: 'Enrichment score', type: 'value' },
    yAxis: { name: '# Genes', type: 'value' },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: any) => Math.max(8, Math.min(40, (1 - val[2]) * 40)),
        data,
        itemStyle: {
          color: '#22c55e',
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
  } as const;

  return <EChart option={option as any} />;
}
