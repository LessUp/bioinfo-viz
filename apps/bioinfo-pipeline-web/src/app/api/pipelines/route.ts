import { NextResponse } from 'next/server'
import { listPipelinePreviews } from '@/lib/pipeline-presets'

export async function GET() {
  const pipelines = listPipelinePreviews()
  return NextResponse.json({ pipelines })
}
