import { pipelineTemplates } from '@/lib/pipeline-presets'
import PipelineClient from './PipelineClient'

export const dynamicParams = false

export function generateStaticParams() {
  return pipelineTemplates.map((p) => ({ id: p.id }))
}

export default function PipelinePage({ params }: { params: { id: string } }) {
  return <PipelineClient id={params.id} />
}
