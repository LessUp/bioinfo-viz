import React from 'react'
import type { Pipeline, Stage } from '@/types/pipeline'
import KpiCard from '@/components/common/KpiCard'

function findMetric(stage: Stage | undefined, key: string) {
  return stage?.metrics.find((m) => m.key === key)?.value
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function StageOverviewCards({ pipeline }: { pipeline: Pipeline }) {
  const cards: Array<{ title: string; value: string | number; unit?: string; footnote?: string }> =
    [{ title: '样本数', value: pipeline.samples.length }]

  const stagesById = new Map(pipeline.stages.map((s) => [s.id, s] as const))

  const addMetricCard = (title: string, stageId: string, key: string, unit?: string) => {
    const stage = stagesById.get(stageId)
    const value = findMetric(stage, key)
    if (value !== undefined) {
      cards.push({ title, value, unit })
    }
  }

  const totalReads = asNumber(findMetric(stagesById.get('import'), 'total_reads_m'))
  if (totalReads !== undefined) {
    cards.push({ title: '总读数', value: totalReads, unit: 'M' })
  }

  addMetricCard('Q30 平均', 'qc', 'q30_rate_avg', '%')
  addMetricCard('比对率', 'align', 'alignment_rate', '%')
  addMetricCard('唯一比对', 'align', 'unique_rate', '%')
  addMetricCard('重复率', 'align', 'dup_rate', '%')
  addMetricCard('检测基因数', 'quant', 'genes_detected')
  addMetricCard('转录本数', 'quant', 'transcripts_detected')
  addMetricCard('中位 TPM', 'normalize', 'median_tpm')
  addMetricCard('差异基因', 'deg', 'deg_found')
  addMetricCard('UMI 深度', 'normalize', 'umi_depth')
  addMetricCard('保留细胞', 'qc', 'cells_retained')
  addMetricCard('高变基因', 'normalize', 'highly_variable')
  addMetricCard('聚类数', 'cluster', 'clusters')

  const snp = asNumber(findMetric(stagesById.get('variant'), 'snp_count')) ?? 0
  const indel = asNumber(findMetric(stagesById.get('variant'), 'indel_count')) ?? 0
  if (snp || indel) {
    cards.push({ title: '变异总数', value: snp + indel })
  }
  const titv = findMetric(stagesById.get('variant'), 'titv')
  if (titv !== undefined) {
    cards.push({ title: 'Ti/Tv', value: String(titv) })
  }

  const progress =
    asNumber(findMetric(stagesById.get('deg'), 'progress')) ??
    asNumber(findMetric(stagesById.get('cluster'), 'progress')) ??
    asNumber(findMetric(stagesById.get('report'), 'progress'))
  if (progress !== undefined) {
    cards.push({ title: '当前阶段进度', value: progress, unit: '%' })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.slice(0, 8).map((card) => (
        <KpiCard
          key={card.title}
          title={card.title}
          value={card.value}
          unit={card.unit}
          footnote={card.footnote}
        />
      ))}
    </div>
  )
}
