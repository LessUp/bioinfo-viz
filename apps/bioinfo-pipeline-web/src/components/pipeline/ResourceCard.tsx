import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { ResourceLink } from '@/types/pipeline';

function iconForKind(kind: ResourceLink['kind']) {
  switch (kind) {
    case 'doc':
      return '📄';
    case 'app':
      return '🧪';
    case 'external':
    default:
      return '🌐';
  }
}

const badgeTone = {
  doc: 'neutral',
  app: 'accent',
  external: 'warning',
} as const;

export default function ResourceCard({ resource }: { resource: ResourceLink }) {
  return (
    <Card className="flex h-full flex-col" elevation="md">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {iconForKind(resource.kind)}
        </span>
        <div>
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{resource.title}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{resource.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone={badgeTone[resource.kind]}>
          {resource.kind === 'doc' ? '讲义' : resource.kind === 'app' ? '互动演示' : '外部资源'}
        </Badge>
        <a
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-300"
          href={resource.href}
          target={resource.kind === 'external' ? '_blank' : undefined}
          rel={resource.kind === 'external' ? 'noreferrer' : undefined}
        >
          查看
        </a>
      </div>
    </Card>
  );
}
