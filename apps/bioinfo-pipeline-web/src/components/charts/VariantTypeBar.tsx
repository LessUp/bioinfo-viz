"use client";

import React from 'react';
import EChart from '@/components/echarts/EChart';

export default function VariantTypeBar({ snp, indel }: { snp: number; indel: number }) {
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 10, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['SNP', 'Indel'] },
    yAxis: { type: 'value', name: 'Count' },
    series: [
      {
        type: 'bar',
        data: [snp, indel],
        itemStyle: { color: '#2563eb' },
      },
    ],
  } as const;
  return <EChart option={option as any} />;
}
