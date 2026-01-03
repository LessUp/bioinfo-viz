import type {
  Metric,
  Pipeline,
  PipelinePreview,
  PipelineProfile,
  ResourceLink,
  RunStatus,
  Sample,
  Stage,
} from '@/types/pipeline'
import { ROUTES } from '@/lib/routes'

interface StageTemplate extends Omit<Stage, 'startedAt' | 'finishedAt'> {
  /** seconds ago */
  startedAgo?: number
  /** seconds ago */
  finishedAgo?: number
  estimatedDurationSec?: number
}

export interface PipelineTemplate {
  id: string
  project: string
  status: RunStatus
  profile: PipelineProfile
  summary: string
  highlights: string[]
  resources: ResourceLink[]
  defaultSamples: Sample[]
  stageTemplates: StageTemplate[]
}

const DEFAULT_SAMPLES: Sample[] = [
  { id: 'S1', name: 'S1' },
  { id: 'S2', name: 'S2' },
  { id: 'S3', name: 'S3' },
  { id: 'S4', name: 'S4' },
  { id: 'S5', name: 'S5' },
  { id: 'S6', name: 'S6' },
]

const wesResources: ResourceLink[] = [
  {
    title: 'NGS 流程入门讲义',
    description: '循序渐进回顾 DNA 测序、读长比对与变异检测的关键概念。',
    href: ROUTES.docs.ngsAnalysisGuide,
    kind: 'doc',
  },
  {
    title: 'BWA 算法交互演示',
    description: '结合动画理解种子扩展、评分矩阵与比对策略。',
    href: ROUTES.apps.bwaAlgorithmViz,
    kind: 'app',
  },
]

const rnaResources: ResourceLink[] = [
  {
    title: '差异表达分析流程概览',
    description: '总结 RNA-Seq 数据预处理、定量与统计检验的要点。',
    href: ROUTES.external.rnaSeqGuide,
    kind: 'external',
  },
  {
    title: '基因表达富集演示',
    description: '探索 GO/KEGG 通路与富集气泡图的解读技巧。',
    href: ROUTES.apps.gatkRunDashboard,
    kind: 'app',
  },
]

const scResources: ResourceLink[] = [
  {
    title: '单细胞分析互动课程',
    description: '涵盖过滤、归一化、聚类与细胞类型注释。',
    href: ROUTES.external.singleCellHub,
    kind: 'external',
  },
  {
    title: 'UMAP/TSNE 可视化练习',
    description: '体验降维可视化的参数调整与标注。',
    href: ROUTES.apps.genomeAlignViz,
    kind: 'app',
  },
]

function makeStage(
  data: Omit<StageTemplate, 'startedAgo' | 'finishedAgo' | 'estimatedDurationSec'> & {
    startedAgo: number
    finishedAgo?: number
    estimatedDurationSec?: number
  }
): StageTemplate {
  return {
    ...data,
    startedAgo: data.startedAgo,
    finishedAgo: data.finishedAgo,
    estimatedDurationSec: data.estimatedDurationSec,
  }
}

const wesStages: StageTemplate[] = [
  makeStage({
    id: 'import',
    name: '数据导入',
    order: 0,
    status: 'succeeded',
    startedAgo: 3600,
    finishedAgo: 3500,
    metrics: [metric('samples', '样本数', 6), metric('total_reads_m', '总读数', 120.3, 'M')],
    artifacts: [],
    logs: [{ ts: isoAgo(3550), level: 'info', message: '上传完成' }],
  }),
  makeStage({
    id: 'qc',
    name: '质控',
    order: 1,
    status: 'succeeded',
    startedAgo: 3499,
    finishedAgo: 3300,
    metrics: [
      metric('q30_rate_avg', 'Q30 平均', 92.4, '%'),
      metric('gc_content_avg', 'GC 平均', 48.1, '%'),
    ],
    artifacts: [{ id: 'fastqc', name: 'fastqc_report.html', type: 'report', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'align',
    name: '比对',
    order: 2,
    status: 'succeeded',
    startedAgo: 3299,
    finishedAgo: 2900,
    metrics: [
      metric('alignment_rate', '比对率', 99.1, '%'),
      metric('dup_rate', '重复率', 5.8, '%'),
    ],
    artifacts: [{ id: 'bam', name: 'merged.bam', type: 'bam', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'dedup',
    name: '去重',
    order: 3,
    status: 'succeeded',
    startedAgo: 2899,
    finishedAgo: 2700,
    metrics: [metric('post_dup_rate', '去重后重复率', 1.2, '%')],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'recal',
    name: '重校正',
    order: 4,
    status: 'succeeded',
    startedAgo: 2699,
    finishedAgo: 2550,
    metrics: [metric('bqsr_applied', 'BQSR 校正', 1)],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'variant',
    name: '变异检测',
    order: 5,
    status: 'succeeded',
    startedAgo: 2549,
    finishedAgo: 2200,
    metrics: [
      metric('snp_count', 'SNP 数量', 23450),
      metric('indel_count', 'Indel 数量', 3120),
      metric('titv', 'Ti/Tv', 2.1),
    ],
    artifacts: [{ id: 'vcf', name: 'variants.vcf.gz', type: 'vcf', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'annot',
    name: '注释',
    order: 6,
    status: 'succeeded',
    startedAgo: 2199,
    finishedAgo: 2000,
    metrics: [metric('clinvar_pathogenic', 'ClinVar 致病', 12), metric('lof', 'LoF 变异', 35)],
    artifacts: [{ id: 'ann', name: 'annotated.vcf.gz', type: 'vcf', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'enrich',
    name: '富集/通路',
    order: 7,
    status: 'succeeded',
    startedAgo: 1999,
    finishedAgo: 1800,
    metrics: [metric('top_pathway', 'Top 通路', 'DNA repair')],
    artifacts: [{ id: 'enrich', name: 'enrichment.json', type: 'json', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'report',
    name: '汇总报告',
    order: 8,
    status: 'running',
    startedAgo: 1799,
    estimatedDurationSec: 400,
    metrics: [metric('progress', '进度', 60, '%')],
    artifacts: [],
    logs: [],
  }),
]

const rnaStages: StageTemplate[] = [
  makeStage({
    id: 'import',
    name: '样本导入',
    order: 0,
    status: 'succeeded',
    startedAgo: 4200,
    finishedAgo: 4100,
    metrics: [metric('samples', '样本数', 12), metric('total_reads_m', '总读数', 480.5, 'M')],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'qc',
    name: '质量评估',
    order: 1,
    status: 'succeeded',
    startedAgo: 4099,
    finishedAgo: 3800,
    metrics: [
      metric('q30_rate_avg', 'Q30 平均', 91.2, '%'),
      metric('rrna_rate', 'rRNA 比例', 2.3, '%'),
    ],
    artifacts: [{ id: 'multiqc', name: 'multiqc.html', type: 'report', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'align',
    name: '转录组比对',
    order: 2,
    status: 'succeeded',
    startedAgo: 3799,
    finishedAgo: 3200,
    metrics: [
      metric('alignment_rate', '比对率', 94.8, '%'),
      metric('unique_rate', '唯一比对', 89.1, '%'),
    ],
    artifacts: [{ id: 'bam', name: 'aligned_transcripts.bam', type: 'bam', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'quant',
    name: '表达量定量',
    order: 3,
    status: 'succeeded',
    startedAgo: 3199,
    finishedAgo: 2900,
    metrics: [
      metric('genes_detected', '检测基因数', 16842),
      metric('transcripts_detected', '转录本数', 35621),
    ],
    artifacts: [{ id: 'count_matrix', name: 'counts.tsv.gz', type: 'matrix', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'normalize',
    name: '归一化',
    order: 4,
    status: 'succeeded',
    startedAgo: 2899,
    finishedAgo: 2700,
    metrics: [metric('median_tpm', '中位 TPM', 12.5), metric('dispersion', '离散度', 0.34)],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'deg',
    name: '差异表达',
    order: 5,
    status: 'running',
    startedAgo: 2699,
    estimatedDurationSec: 600,
    metrics: [metric('deg_found', '已发现差异基因', 842), metric('progress', '进度', 55, '%')],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'pathway',
    name: '通路富集',
    order: 6,
    status: 'pending',
    startedAgo: 0,
    metrics: [],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'report',
    name: '报告生成',
    order: 7,
    status: 'pending',
    startedAgo: 0,
    metrics: [],
    artifacts: [],
    logs: [],
  }),
]

const scStages: StageTemplate[] = [
  makeStage({
    id: 'import',
    name: '矩阵导入',
    order: 0,
    status: 'succeeded',
    startedAgo: 5400,
    finishedAgo: 5300,
    metrics: [metric('samples', '样本数', 4), metric('total_cells', '总细胞数', 128000)],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'qc',
    name: '细胞质控',
    order: 1,
    status: 'succeeded',
    startedAgo: 5299,
    finishedAgo: 5000,
    metrics: [
      metric('cells_retained', '保留细胞', 98650),
      metric('median_genes', '中位基因数', 1890),
    ],
    artifacts: [{ id: 'qc_report', name: 'sc_qc.html', type: 'report', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'normalize',
    name: '归一化',
    order: 2,
    status: 'succeeded',
    startedAgo: 4999,
    finishedAgo: 4700,
    metrics: [metric('umi_depth', 'UMI 深度', 4250), metric('highly_variable', '高变基因', 3000)],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'dim_reduce',
    name: '降维',
    order: 3,
    status: 'succeeded',
    startedAgo: 4699,
    finishedAgo: 4500,
    metrics: [metric('pca_components', 'PCA 组件', 50), metric('umap_neighbors', 'UMAP 邻居', 15)],
    artifacts: [{ id: 'embedding', name: 'umap.json', type: 'json', url: '#' }],
    logs: [],
  }),
  makeStage({
    id: 'cluster',
    name: '聚类',
    order: 4,
    status: 'running',
    startedAgo: 4499,
    estimatedDurationSec: 900,
    metrics: [metric('clusters', '已识别聚类', 14), metric('progress', '进度', 72, '%')],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'annot',
    name: '细胞类型注释',
    order: 5,
    status: 'pending',
    startedAgo: 0,
    metrics: [],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'integration',
    name: '多批次整合',
    order: 6,
    status: 'pending',
    startedAgo: 0,
    metrics: [],
    artifacts: [],
    logs: [],
  }),
  makeStage({
    id: 'report',
    name: '可视化汇报',
    order: 7,
    status: 'pending',
    startedAgo: 0,
    metrics: [],
    artifacts: [],
    logs: [],
  }),
]

export const pipelineTemplates: PipelineTemplate[] = [
  {
    id: 'wes-germline',
    project: 'WES_Lung_Study',
    status: 'running',
    profile: {
      name: '外显子组变异检测',
      summary: '演示从 FASTQ 到注释变异的典型 WES 流程，配套质量控制与富集分析。',
      category: 'germline',
      difficulty: 'intermediate',
      recommendedAudiences: ['分子诊断实验室', '医学信息分析师'],
      keyConcepts: ['BWA 比对', 'GATK 校正', '变异注释'],
    },
    summary: '以肺癌队列为例展示 WES 流程的每个节点，支持实时查看运行状态、指标和产出物。',
    highlights: ['覆盖 Picard/GATK 等常用工具', '结合 BWA 算法演示强化理解', '终端报告结构可复用'],
    resources: wesResources,
    defaultSamples: DEFAULT_SAMPLES,
    stageTemplates: wesStages,
  },
  {
    id: 'bulk-rna-seq',
    project: 'RNASeq_Tumor_vs_Normal',
    status: 'running',
    profile: {
      name: 'Bulk RNA-Seq 差异表达',
      summary: '讲解基于 STAR + DESeq2 的 RNA-Seq 处理流程，涵盖定量、归一化与统计检验。',
      category: 'transcriptomics',
      difficulty: 'intermediate',
      recommendedAudiences: ['功能基因组学研究者', '转化医学项目团队'],
      keyConcepts: ['表达量矩阵构建', '差异表达统计', '通路富集'],
    },
    summary: '通过多样本转录组项目展示如何追踪定量、差异分析以及后续富集步骤的可视化指标。',
    highlights: ['实时掌握表达矩阵质量', '差异表达进度可视化', '可拓展到时序分析'],
    resources: rnaResources,
    defaultSamples: DEFAULT_SAMPLES.map((s, idx) => ({
      ...s,
      id: `T${idx + 1}`,
      name: `Tumor_${idx + 1}`,
    })),
    stageTemplates: rnaStages,
  },
  {
    id: 'single-cell',
    project: 'scRNA_Atlas',
    status: 'running',
    profile: {
      name: '单细胞表达谱构建',
      summary: '覆盖 QC、归一化、降维、聚类到细胞类型注释的单细胞 RNA 分析流程。',
      category: 'single-cell',
      difficulty: 'advanced',
      recommendedAudiences: ['单细胞研究者', '算法工程师'],
      keyConcepts: ['UMI 质控', '降维嵌入', '聚类注释'],
    },
    summary: '强调高通量单细胞项目中的关键指标与可视化，帮助掌握跨批次整合策略。',
    highlights: ['高变基因筛选指标', '聚类进度实时追踪', '可与降维可视化练习联动'],
    resources: scResources,
    defaultSamples: [
      { id: 'PBMC_A', name: 'PBMC_A' },
      { id: 'PBMC_B', name: 'PBMC_B' },
      { id: 'Tumor_A', name: 'Tumor_A' },
      { id: 'Tumor_B', name: 'Tumor_B' },
    ],
    stageTemplates: scStages,
  },
]

function isoAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

function metric(key: string, label: string, value: number | string, unit?: string): Metric {
  return { key, label, value, unit }
}

function materializeStage({
  startedAgo,
  finishedAgo,
  estimatedDurationSec,
  ...rest
}: StageTemplate): Stage {
  const stage: Stage = {
    ...rest,
    metrics: rest.metrics.map((m) => ({ ...m })),
    artifacts: rest.artifacts.map((a) => ({ ...a })),
    logs: rest.logs.map((l) => ({ ...l })),
  }
  if (startedAgo !== undefined) {
    stage.startedAt = isoAgo(startedAgo)
  }
  if (finishedAgo !== undefined) {
    stage.finishedAt = isoAgo(finishedAgo)
  }
  if (stage.startedAt && stage.finishedAt && rest.durationSec === undefined) {
    stage.durationSec = Math.max(0, startedAgo! - finishedAgo!)
  } else if (rest.durationSec !== undefined) {
    stage.durationSec = rest.durationSec
  } else if (estimatedDurationSec !== undefined) {
    stage.durationSec = estimatedDurationSec
  }
  return stage
}

export function buildPipelineRun(id: string): Pipeline | undefined {
  const template = pipelineTemplates.find((p) => p.id === id)
  if (!template) return undefined
  return {
    id: template.id,
    project: template.project,
    status: template.status,
    samples: template.defaultSamples.map((s) => ({ ...s })),
    stages: template.stageTemplates.map(materializeStage),
    profile: template.profile,
    summary: template.summary,
    highlights: template.highlights,
    resources: template.resources,
  } as Pipeline
}

export function listPipelinePreviews(): PipelinePreview[] {
  return pipelineTemplates.map((p) => ({
    id: p.id,
    name: p.profile.name,
    summary: p.summary,
    highlights: p.highlights,
    difficulty: p.profile.difficulty,
    category: p.profile.category,
    keyConcepts: p.profile.keyConcepts,
  }))
}
