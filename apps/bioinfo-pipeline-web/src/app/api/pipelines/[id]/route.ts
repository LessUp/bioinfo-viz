import { NextRequest, NextResponse } from 'next/server'
import { getPipelineDataSource, getDefaultPipelineId } from '@/lib/pipeline-data-source'

export const revalidate = 60
export const runtime = 'edge'

const dataSource = getPipelineDataSource()
const fallbackId = getDefaultPipelineId()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const pipeline =
      (await dataSource.getPipeline(id)) ?? (await dataSource.getPipeline(fallbackId))
    if (!pipeline) {
      return NextResponse.json({ message: 'Pipeline not found' }, { status: 404 })
    }
    return NextResponse.json(pipeline, { headers: { 'cache-control': 'public, max-age=30' } })
  } catch {
    const fb = await dataSource.getPipeline(fallbackId)
    if (fb) {
      return NextResponse.json(fb, { headers: { 'x-fallback': '1' } })
    }
    return NextResponse.json({ message: 'Pipeline error' }, { status: 500 })
  }
}
