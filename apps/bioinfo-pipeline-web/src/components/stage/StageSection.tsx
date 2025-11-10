"use client";

import React from 'react';
import type { Pipeline, Stage } from '@/types/pipeline';
import StatusPill from '@/components/common/StatusPill';
import KpiCard from '@/components/common/KpiCard';
import GCContentLine from '@/components/charts/GCContentLine';
import CoverageDepthHist from '@/components/charts/CoverageDepthHist';
import VariantTypeBar from '@/components/charts/VariantTypeBar';
import TiTvGauge from '@/components/charts/TiTvGauge';
import EnrichmentBubble from '@/components/charts/EnrichmentBubble';

function metricValue(stage: Stage, key: string) {
  return stage.metrics.find((m) => m.key === key)?.value;
}

const stageGuides: Record<string, string> = {
  quant: '关注表达矩阵的基因覆盖数与转录本检测情况，可结合富集模块进一步探索生物学意义。',
  deg: '观察差异基因数量与统计阈值，适时导出结果用于下游可视化或报告撰写。',
  pathway: '结合富集气泡图或外部工具，梳理与表型相关的通路，准备课堂讨论要点。',
  cluster: '对比不同聚类参数的影响，记录聚类数量与代表性 marker 基因。',
  'dim_reduce': '调节降维参数，确保主要细胞群分离效果良好，便于后续注释。',
  integration: '多批次整合阶段需记录批次效应消除前后的指标，为部署真实数据做准备。',
};

export default function StageSection({ pipeline, stage }: { pipeline: Pipeline; stage: Stage }) {
  return (
    <section id={`stage-${stage.id}`} className="scroll-mt-20 rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stage.order + 1}. {stage.name}</div>
        <StatusPill status={stage.status} />
      </div>
      
      {stage.metrics.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stage.metrics.slice(0, 4).map((m) => (
            <KpiCard key={m.key} title={m.label} value={m.value as any} unit={m.unit} />
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {stage.id === 'qc' ? (
          <GCContentLine seed={`gc-${pipeline.id}`} series={Math.max(2, pipeline.samples.length)} />
        ) : stage.id === 'align' ? (
          <CoverageDepthHist seed={`cov-${pipeline.id}`} />
        ) : stage.id === 'variant' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <VariantTypeBar
              snp={Number(metricValue(stage, 'snp_count') ?? 0)}
              indel={Number(metricValue(stage, 'indel_count') ?? 0)}
            />
            <TiTvGauge value={Number(metricValue(stage, 'titv') ?? 0)} />
          </div>
        ) : stage.id === 'enrich' ? (
          <EnrichmentBubble seed={`enrich-${pipeline.id}`} />
        ) : null}
      </div>

      {stageGuides[stage.id] ? (
        <div className="mt-4 rounded-lg bg-blue-50/70 p-3 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
          教学提示：{stageGuides[stage.id]}
        </div>
      ) : null}

      {stage.artifacts.length > 0 ? (
        <div className="mt-4">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">产出物</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {stage.artifacts.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.name}</span>
                {a.url ? (
                  <>
                    {' '}
                    <a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                      查看
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
