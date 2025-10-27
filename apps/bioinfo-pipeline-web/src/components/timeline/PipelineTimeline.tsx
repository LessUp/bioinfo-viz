"use client";

import React from 'react';
import type { Stage } from '@/types/pipeline';
import StatusPill from '@/components/common/StatusPill';

function statusColor(status: Stage['status']) {
  switch (status) {
    case 'succeeded':
      return 'bg-green-500';
    case 'running':
      return 'bg-blue-500 animate-pulse';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
      return 'bg-zinc-400';
    case 'skipped':
      return 'bg-amber-500';
    default:
      return 'bg-zinc-400';
  }
}

export default function PipelineTimeline({
  stages,
  onSelect,
}: {
  stages: Stage[];
  onSelect?: (stageId: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center gap-6 min-w-max px-2 py-3">
        {stages
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s, i) => (
            <li key={s.id} className="flex items-center">
              <button
                onClick={() => onSelect?.(s.id)}
                className="group flex flex-col items-center focus:outline-none"
              >
                <div className="flex items-center">
                  <div className={`h-3 w-10 ${i === 0 ? 'invisible' : 'bg-zinc-200 dark:bg-zinc-700'} rounded-full`} />
                  <div
                    className={`h-6 w-6 rounded-full border-2 border-white shadow ring-2 ring-zinc-300 dark:ring-zinc-700 ${statusColor(
                      s.status
                    )}`}
                  />
                  <div className={`h-3 w-10 ${i === stages.length - 1 ? 'invisible' : 'bg-zinc-200 dark:bg-zinc-700'} rounded-full`} />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                    {s.name}
                  </div>
                  <div className="mt-1">
                    <StatusPill status={s.status} />
                  </div>
                </div>
              </button>
            </li>
          ))}
      </ol>
    </div>
  );
}
