import { NextResponse } from 'next/server';
import type { Pipeline, Stage } from '@/types/pipeline';

function nowMinus(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

function buildStages(): Stage[] {
  const stages: Stage[] = [
    { id: 'import', name: '数据导入', order: 0, status: 'succeeded', startedAt: nowMinus(3600), finishedAt: nowMinus(3500), durationSec: 100, metrics: [
      { key: 'samples', label: '样本数', value: 6 },
      { key: 'total_reads_m', label: '总读数', value: 120.3, unit: 'M' },
    ], artifacts: [], logs: [{ ts: nowMinus(3550), level: 'info', message: '上传完成' }] },
    { id: 'qc', name: '质控', order: 1, status: 'succeeded', startedAt: nowMinus(3499), finishedAt: nowMinus(3300), durationSec: 199, metrics: [
      { key: 'q30_rate_avg', label: 'Q30 平均', value: 92.4, unit: '%' },
      { key: 'gc_content_avg', label: 'GC 平均', value: 48.1, unit: '%' },
    ], artifacts: [{ id: 'fastqc', name: 'fastqc_report.html', type: 'report', url: '/files/fastqc.html' }], logs: [] },
    { id: 'align', name: '比对', order: 2, status: 'succeeded', startedAt: nowMinus(3299), finishedAt: nowMinus(2900), durationSec: 399, metrics: [
      { key: 'alignment_rate', label: '比对率', value: 99.1, unit: '%' },
      { key: 'dup_rate', label: '重复率', value: 5.8, unit: '%' },
    ], artifacts: [{ id: 'bam', name: 'merged.bam', type: 'bam', url: '#' }], logs: [] },
    { id: 'dedup', name: '去重', order: 3, status: 'succeeded', startedAt: nowMinus(2899), finishedAt: nowMinus(2700), durationSec: 199, metrics: [
      { key: 'post_dup_rate', label: '去重后重复率', value: 1.2, unit: '%' },
    ], artifacts: [], logs: [] },
    { id: 'recal', name: '重校正', order: 4, status: 'succeeded', startedAt: nowMinus(2699), finishedAt: nowMinus(2550), durationSec: 149, metrics: [
      { key: 'bqsr_applied', label: 'BQSR 校正', value: 1 },
    ], artifacts: [], logs: [] },
    { id: 'variant', name: '变异检测', order: 5, status: 'succeeded', startedAt: nowMinus(2549), finishedAt: nowMinus(2200), durationSec: 349, metrics: [
      { key: 'snp_count', label: 'SNP 数量', value: 23450 },
      { key: 'indel_count', label: 'Indel 数量', value: 3120 },
      { key: 'titv', label: 'Ti/Tv', value: 2.1 },
    ], artifacts: [{ id: 'vcf', name: 'variants.vcf.gz', type: 'vcf', url: '#' }], logs: [] },
    { id: 'annot', name: '注释', order: 6, status: 'succeeded', startedAt: nowMinus(2199), finishedAt: nowMinus(2000), durationSec: 199, metrics: [
      { key: 'clinvar_pathogenic', label: 'ClinVar 致病', value: 12 },
      { key: 'lof', label: 'LoF 变异', value: 35 },
    ], artifacts: [{ id: 'ann', name: 'annotated.vcf.gz', type: 'vcf', url: '#' }], logs: [] },
    { id: 'enrich', name: '富集/通路', order: 7, status: 'succeeded', startedAt: nowMinus(1999), finishedAt: nowMinus(1800), durationSec: 199, metrics: [
      { key: 'top_pathway', label: 'Top 通路', value: 'DNA repair' },
    ], artifacts: [{ id: 'enrich', name: 'enrichment.json', type: 'json', url: '#' }], logs: [] },
    { id: 'report', name: '汇总报告', order: 8, status: 'running', startedAt: nowMinus(1799), metrics: [
      { key: 'progress', label: '进度', value: 60, unit: '%' },
    ], artifacts: [], logs: [] },
  ];
  return stages;
}

function buildSamples() {
  return [
    { id: 'S1', name: 'S1' },
    { id: 'S2', name: 'S2' },
    { id: 'S3', name: 'S3' },
    { id: 'S4', name: 'S4' },
    { id: 'S5', name: 'S5' },
    { id: 'S6', name: 'S6' },
  ];
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id || 'demo';
  const pipeline: Pipeline = {
    id,
    project: 'WES_Lung_Study',
    samples: buildSamples(),
    status: 'running',
    stages: buildStages(),
  };
  return NextResponse.json(pipeline);
}
