import PipelineClient from './PipelineClient'

export default function PipelinePage({ params }: { params: { id: string } }) {
  return <PipelineClient id={params.id} />
}
