import { NextResponse } from 'next/server';
import { buildPipelineRun, pipelineTemplates } from '@/lib/pipeline-presets';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const fallback = pipelineTemplates[0]?.id ?? 'wes-germline';
  const id = params.id || fallback;
  const pipeline = buildPipelineRun(id) ?? buildPipelineRun(fallback);
  if (!pipeline) {
    return NextResponse.json({ message: 'Pipeline not found' }, { status: 404 });
  }
  return NextResponse.json(pipeline);
}
