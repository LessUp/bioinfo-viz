import React from 'react'
import type { RunStatus } from '@/types/pipeline'

function colorOf(status: RunStatus) {
  switch (status) {
    case 'succeeded':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'running':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'pending':
      return 'bg-zinc-100 text-zinc-700 border-zinc-200'
    case 'skipped':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200'
  }
}

export default function StatusPill({ status }: { status: RunStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorOf(status)}`}
    >
      {status}
    </span>
  )
}
