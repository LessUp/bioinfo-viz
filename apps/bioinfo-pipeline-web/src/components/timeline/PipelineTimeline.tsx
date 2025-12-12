'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Stage } from '@/types/pipeline'
import StatusPill from '@/components/common/StatusPill'
import { cn } from '@/lib/utils'

function statusColor(status: Stage['status']) {
  switch (status) {
    case 'succeeded':
      return 'bg-green-500 border-green-500 ring-green-200 dark:ring-green-900'
    case 'running':
      return 'bg-blue-500 border-blue-500 ring-blue-200 dark:ring-blue-900 animate-pulse'
    case 'failed':
      return 'bg-red-500 border-red-500 ring-red-200 dark:ring-red-900'
    case 'pending':
      return 'bg-white border-zinc-300 ring-zinc-100 dark:bg-zinc-800 dark:border-zinc-600 dark:ring-zinc-800'
    case 'skipped':
      return 'bg-amber-100 border-amber-300 ring-amber-100 dark:bg-amber-900/20 dark:border-amber-700'
    default:
      return 'bg-zinc-100 border-zinc-300 ring-zinc-100'
  }
}

export default function PipelineTimeline({
  stages,
  onSelect,
}: {
  stages: Stage[]
  onSelect?: (stageId: string) => void
}) {
  const sortedStages = stages.slice().sort((a, b) => a.order - b.order)

  return (
    <div className="w-full overflow-x-auto pb-4">
      <ol className="flex items-start justify-between min-w-max px-4">
        {sortedStages.map((s, i) => {
          const isLast = i === sortedStages.length - 1
          return (
            <li key={s.id} className="relative flex flex-1 flex-col items-center">
              {/* Connecting Line */}
              {!isLast && (
                <div className="absolute left-[50%] right-[-50%] top-3 -z-10 h-0.5 bg-zinc-200 dark:bg-zinc-800">
                  {(s.status === 'succeeded' || s.status === 'running') && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                      className="h-full bg-blue-500"
                    />
                  )}
                </div>
              )}

              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onSelect?.(s.id)}
                className="group flex flex-col items-center focus:outline-none"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 group-hover:scale-110',
                    statusColor(s.status),
                    s.status === 'running' && 'ring-4'
                  )}
                />

                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {s.name}
                  </span>
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    <StatusPill status={s.status} />
                  </div>
                </div>
              </motion.button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
