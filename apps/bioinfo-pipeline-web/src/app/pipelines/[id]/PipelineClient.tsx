"use client";

import React, { useCallback } from 'react';
import useSWR from 'swr';
import { getApi } from '@/lib/fetch';
import type { Pipeline } from '@/types/pipeline';
import PipelineTimeline from '@/components/timeline/PipelineTimeline';
import StageOverviewCards from '@/components/stage/StageOverviewCards';
import StageSection from '@/components/stage/StageSection';

export default function PipelineClient({ id }: { id: string }) {
  const { data, error, isLoading, mutate } = useSWR<Pipeline>(`/api/pipelines/${id}`, getApi);

  const handleSelect = useCallback((stageId: string) => {
    const el = document.getElementById(`stage-${stageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
          加载失败：{String((error as any)?.message || error)}
        </div>
      </div>
    );
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
    );
  }

  const pipeline = data;

  return (
    <div className="min-h-screen bg-zinc-50 pb-10 font-sans dark:bg-black">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{pipeline.project}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Pipeline: {pipeline.id}</div>
          </div>
          <button
            className="rounded-full border px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => mutate()}
          >
            刷新
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-3">
          <PipelineTimeline stages={pipeline.stages} onSelect={handleSelect} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-6">
        <StageOverviewCards pipeline={pipeline} />

        <div className="mt-6 grid grid-cols-1 gap-4">
          {pipeline.stages
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <StageSection key={s.id} pipeline={pipeline} stage={s} />
            ))}
        </div>
      </main>
    </div>
  );
}
