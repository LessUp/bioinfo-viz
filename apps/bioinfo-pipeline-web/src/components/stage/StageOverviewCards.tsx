import React from 'react';
import type { Pipeline } from '@/types/pipeline';
import KpiCard from '@/components/common/KpiCard';

function getMetric(p: Pipeline, stageId: string, key: string) {
  const st = p.stages.find((s) => s.id === stageId);
  return st?.metrics.find((m) => m.key === key)?.value;
}

export default function StageOverviewCards({ pipeline }: { pipeline: Pipeline }) {
  const samples = pipeline.samples.length;
  const totalReadsM = Number(getMetric(pipeline, 'import', 'total_reads_m') ?? 0);
  const alignRate = Number(getMetric(pipeline, 'align', 'alignment_rate') ?? 0);
  const snp = Number(getMetric(pipeline, 'variant', 'snp_count') ?? 0);
  const indel = Number(getMetric(pipeline, 'variant', 'indel_count') ?? 0);
  const titv = getMetric(pipeline, 'variant', 'titv');

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard title="样本数" value={samples} />
      <KpiCard title="总读数" value={totalReadsM} unit="M" />
      <KpiCard title="比对率" value={alignRate} unit="%" />
      <KpiCard title="变异数" value={snp + indel} />
      {titv !== undefined ? <KpiCard title="Ti/Tv" value={String(titv)} /> : null}
    </div>
  );
}
