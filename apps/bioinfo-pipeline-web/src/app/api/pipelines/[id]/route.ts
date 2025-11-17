import { NextRequest, NextResponse } from 'next/server';
import { buildPipelineRun, pipelineTemplates } from '@/lib/pipeline-presets';

export const revalidate = 60;
export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const fallback = pipelineTemplates[0]?.id ?? 'wes-germline';
  const { id } = await params;
  try {
    const pipeline = buildPipelineRun(id || fallback) ?? buildPipelineRun(fallback);
    if (!pipeline) {
      return NextResponse.json({ message: 'Pipeline not found' }, { status: 404 });
    }
    return NextResponse.json(pipeline, { headers: { 'cache-control': 'public, max-age=30' } });
  } catch (e: any) {
    const fb = buildPipelineRun(fallback);
    if (fb) {
      return NextResponse.json(fb, { headers: { 'x-fallback': '1' } });
    }
    return NextResponse.json({ message: 'Pipeline error' }, { status: 500 });
  }
}
