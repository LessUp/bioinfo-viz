import React from 'react'
import { FileText, AppWindow, Globe, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { withBasePath } from '@/lib/base-path'
import type { ResourceLink } from '@/types/pipeline'

function getIcon(kind: ResourceLink['kind']) {
  switch (kind) {
    case 'doc':
      return <FileText className="h-6 w-6 text-blue-500" />
    case 'app':
      return <AppWindow className="h-6 w-6 text-purple-500" />
    case 'external':
    default:
      return <Globe className="h-6 w-6 text-zinc-500" />
  }
}

const badgeTone = {
  doc: 'neutral',
  app: 'accent',
  external: 'warning',
} as const

export default function ResourceCard({ resource }: { resource: ResourceLink }) {
  const href = resource.kind === 'external' ? resource.href : withBasePath(resource.href)

  return (
    <Card className="flex h-full flex-col" elevation="sm" interactive>
      <div className="flex items-start gap-4">
        <div className="flex-none rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
          {getIcon(resource.kind)}
        </div>
        <div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {resource.title}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{resource.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone={badgeTone[resource.kind]}>
          {resource.kind === 'doc' ? '讲义' : resource.kind === 'app' ? '互动演示' : '外部资源'}
        </Badge>
        <a
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-300"
          href={href}
          target={resource.kind === 'external' ? '_blank' : undefined}
          rel={resource.kind === 'external' ? 'noreferrer' : undefined}
        >
          查看
          {resource.kind === 'external' && <ExternalLink className="h-3 w-3" />}
        </a>
      </div>
    </Card>
  )
}
