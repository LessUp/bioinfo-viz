import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LearningPathPlanner from '@/components/learning/LearningPathPlanner';
import ResourceCard from '@/components/pipeline/ResourceCard';
import { listPipelinePreviews } from '@/lib/pipeline-presets';
import type { ResourceLink } from '@/types/pipeline';

const knowledgeBase: ResourceLink[] = [
  {
    title: 'NGS 流程入门讲义',
    description: '课堂讲义与术语速查，快速回顾测序分析步骤。',
    href: '/docs/ngs-analysis-guide',
    kind: 'doc',
  },
  {
    title: 'NGS vs TGS 幻灯片',
    description: '教学演示可直接打开的对比幻灯片。',
    href: '/slides/ngs-vs-tgs',
    kind: 'doc',
  },
  {
    title: 'Mock API 数据结构',
    description: '了解 pipeline-presets 如何生成演示数据，方便二次开发。',
    href: 'https://github.com/your-org/bioinfo-visualizer',
    kind: 'external',
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  germline: '外显子/胚系',
  transcriptomics: '转录组',
  'single-cell': '单细胞',
  metagenomics: '宏基因组',
  other: '其他',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

const labTools = [
  {
    name: 'Picard Workflow SPA',
    description: '逐步演练去重、重校正等核心步骤。',
    href: '/apps/picard-workflow-spa',
    tag: 'DNA 流程',
  },
  {
    name: 'BWA 算法动画',
    description: '通过动画理解比对算法细节。',
    href: '/apps/bwa-algorithm-viz',
    tag: '算法原理',
  },
  {
    name: 'SW/NW 序列比对演示',
    description: '动态规划矩阵填充与回溯路径动画。',
    href: '/apps/smith-waterman-viz',
    tag: '算法原理',
  },
  {
    name: 'de Bruijn 图演示',
    description: 'k-mer 分解、图构建与 Euler 路动画。',
    href: '/apps/debruijn-viz',
    tag: '组装原理',
  },
  {
    name: 'GATK 运行监控',
    description: '查看实时日志、指标与异常告警示例。',
    href: '/apps/gatk-run-dashboard',
    tag: '运行监控',
  },
];

export default function Home() {
  const pipelinePreviews = listPipelinePreviews();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-blue-50 dark:from-black dark:via-zinc-900 dark:to-black">
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.8fr_1fr] lg:items-center">
          <div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
              BioInfo Visualizer Playbook
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              构建生物信息课程的互动演示与学习路径
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              统一的可视化平台覆盖 WES、RNA-Seq、单细胞等流程，配套知识库与交互式学习路径，帮助讲师和学习者快速定位所需模块，持续迭代教学内容。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                href="/pipelines/wes-germline"
              >
                进入外显子流程演示
              </Link>
              <Link
                className="rounded-full border border-blue-500 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/20"
                href="/pipelines/bulk-rna-seq"
              >
                查看 RNA-Seq 模块
              </Link>
            </div>
          </div>
          <Card elevation="md" className="relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-br from-blue-500/10 to-blue-500/40 blur-3xl sm:block" aria-hidden />
            <div className="relative">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">开发路线图</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <li>• 扩展流程模块到 RNA-Seq、单细胞等场景</li>
                <li>• 统一组件库与 Mock API，方便切换真实服务</li>
                <li>• 集成 Docs & Slides，打造一站式教学体验</li>
              </ul>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">从技术到运营的迭代建议，已在当前示例中落地基础框架。</p>
            </div>
          </Card>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">可视化流程目录</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">挑选不同流程演示，快速跳转到对应该用场景。</p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">统一 UI 组件 + Mock API 数据层</span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pipelinePreviews.map((pipeline) => (
              <Card key={pipeline.id} elevation="md" className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{CATEGORY_LABEL[pipeline.category] ?? pipeline.category}</Badge>
                    <Badge tone="neutral">{DIFFICULTY_LABEL[pipeline.difficulty] ?? pipeline.difficulty}</Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{pipeline.name}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{pipeline.summary}</p>
                  <ul className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {pipeline.highlights.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300"
                  href={`/pipelines/${pipeline.id}`}
                >
                  查看详情 →
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">交互式学习路径</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">针对不同角色设计分级任务，可标记完成进度并跳转到相关模块。</p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">支持自学/授课双场景</span>
          </div>
          <div className="mt-6">
            <LearningPathPlanner />
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">资料与讲义集成</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Docs 与 Slides 一站式访问，适配线上线下授课。</p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">持续补充课程素材</span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {knowledgeBase.map((resource) => (
              <ResourceCard key={resource.title} resource={resource} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">关联实验工具</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">与仓库内其他子应用联动，扩展教学互动性。</p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Vite/React & Next.js 共用组件</span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {labTools.map((tool) => (
              <Card key={tool.name} elevation="md" className="flex h-full flex-col justify-between">
                <div>
                  <Badge tone="neutral">{tool.tag}</Badge>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{tool.name}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{tool.description}</p>
                </div>
                <a className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300" href={tool.href}>
                  立即体验 →
                </a>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
