'use client'

import React, { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import type { Pipeline } from '@/types/pipeline'
import { getPipelineDataSource } from '@/lib/pipeline-data-source'
import PipelineTimeline from '@/components/timeline/PipelineTimeline'
import StageOverviewCards from '@/components/stage/StageOverviewCards'
import StageSection from '@/components/stage/StageSection'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ResourceCard from '@/components/pipeline/ResourceCard'

const CATEGORY_LABEL: Record<string, string> = {
  germline: '外显子/胚系',
  transcriptomics: '转录组',
  'single-cell': '单细胞',
  metagenomics: '宏基因组',
  other: '其他',
}

export default function PipelineClient({ id }: { id: string }) {
  const dataSource = useMemo(() => getPipelineDataSource(), [])

  const { data, error, isLoading, isValidating, mutate } = useSWR<Pipeline>(
    ['pipeline', id],
    async () => {
      const pipeline = await dataSource.getPipeline(id)
      if (!pipeline) {
        throw new Error(`Pipeline not found: ${id}`)
      }
      return pipeline
    }
  )

  const handleSelect = useCallback((stageId: string) => {
    const el = document.getElementById(`stage-${stageId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (error) {
    const message = error instanceof Error ? error.message : String(error)
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
          加载失败：{message}
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  const pipeline = data

  return (
    <div className="min-h-screen bg-zinc-50 pb-12 font-sans dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {CATEGORY_LABEL[pipeline.profile.category] ?? 'Bioinformatics'}
            </div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {pipeline.profile.name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              项目：{pipeline.project} · ID：{pipeline.id}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="accent">
              {pipeline.profile.difficulty === 'beginner'
                ? '入门'
                : pipeline.profile.difficulty === 'intermediate'
                  ? '进阶'
                  : '高级'}
            </Badge>
            <button
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
            >
              {isLoading || isValidating ? '刷新中…' : '刷新状态'}
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <PipelineTimeline stages={pipeline.stages} onSelect={handleSelect} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card elevation="md">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">流程简介</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {pipeline.summary}
            </p>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                关键知识点
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {pipeline.profile.keyConcepts.map((concept) => (
                  <li key={concept}>
                    <Badge tone="neutral">{concept}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <Card elevation="md">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">教学提示</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              {pipeline.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                适合人群
              </div>
              <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                {pipeline.profile.recommendedAudiences.map((aud) => (
                  <li key={aud}>{aud}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                示例样本
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pipeline.samples.slice(0, 8).map((sample) => (
                  <Badge key={sample.id} tone="neutral">
                    {sample.name}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">核心指标概览</h2>
          </div>
          <div className="mt-4">
            <StageOverviewCards pipeline={pipeline} />
          </div>
        </section>

        {pipeline.resources.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">配套资料</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                将 Docs & Slides 融入教学流程
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {pipeline.resources.map((resource) => (
                <ResourceCard key={resource.title} resource={resource} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid grid-cols-1 gap-4">
          {pipeline.stages
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <StageSection key={s.id} pipeline={pipeline} stage={s} />
            ))}
        </section>
      </main>
    </div>
  )
}
