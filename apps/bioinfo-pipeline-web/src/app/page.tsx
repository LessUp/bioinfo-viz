"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FlaskConical, GraduationCap, LayoutDashboard, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LearningPathPlanner from '@/components/learning/LearningPathPlanner';
import ResourceCard from '@/components/pipeline/ResourceCard';
import { listPipelinePreviews } from '@/lib/pipeline-presets';
import { ROUTES } from '@/lib/routes';
import type { ResourceLink } from '@/types/pipeline';
import { cn } from '@/lib/utils';

const knowledgeBase: ResourceLink[] = [
  {
    title: 'NGS 流程入门讲义',
    description: '课堂讲义与术语速查，快速回顾测序分析步骤。',
    href: ROUTES.docs.ngsAnalysisGuide,
    kind: 'doc',
  },
  {
    title: 'NGS vs TGS 幻灯片',
    description: '教学演示可直接打开的对比幻灯片。',
    href: ROUTES.slides.ngsVsTgs,
    kind: 'doc',
  },
  {
    title: 'Mock API 数据结构',
    description: '了解 pipeline-presets 如何生成演示数据，方便二次开发。',
    href: ROUTES.external.repo,
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
    href: ROUTES.apps.picardWorkflowSpa,
    tag: 'DNA 流程',
  },
  {
    name: 'BWA 算法动画',
    description: '通过动画理解比对算法细节。',
    href: ROUTES.apps.bwaAlgorithmViz,
    tag: '算法原理',
  },
  {
    name: 'SW/NW 序列比对演示',
    description: '动态规划矩阵填充与回溯路径动画。',
    href: ROUTES.apps.smithWatermanViz,
    tag: '算法原理',
  },
  {
    name: 'de Bruijn 图演示',
    description: 'k-mer 分解、图构建与 Euler 路动画。',
    href: ROUTES.apps.debruijnViz,
    tag: '组装原理',
  },
  {
    name: 'GATK 运行监控',
    description: '查看实时日志、指标与异常告警示例。',
    href: ROUTES.apps.gatkRunDashboard,
    tag: '运行监控',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const pipelinePreviews = listPipelinePreviews();

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#3b82f6_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#1e3a8a_100%)] opacity-50" />
      
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-20"
      >
        {/* Hero Section */}
        <motion.section variants={itemVariants} className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
            >
              <Sparkles className="h-3 w-3" />
              BioInfo Visualizer Playbook
            </motion.div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              构建生物信息课程的
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
                互动演示与学习路径
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              统一的可视化平台覆盖 WES、RNA-Seq、单细胞等流程，配套知识库与交互式学习路径，帮助讲师和学习者快速定位所需模块。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={ROUTES.pipelines.wesGermline}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
              >
                进入外显子流程
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.pipelines.bulkRnaSeq}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
              >
                查看 RNA-Seq 模块
              </Link>
            </div>
          </div>
          
          <Card elevation="md" className="relative overflow-hidden border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">开发路线图</h2>
              </div>
              
              <ul className="space-y-4">
                {[
                  '扩展流程模块到 RNA-Seq、单细胞等场景',
                  '统一组件库与 Mock API，方便切换真实服务',
                  '集成 Docs & Slides，打造一站式教学体验'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                从技术到运营的迭代建议，已在当前示例中落地基础框架。
              </p>
            </div>
          </Card>
        </motion.section>

        {/* Pipeline Section */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-end justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                <FlaskConical className="h-6 w-6 text-blue-500" />
                可视化流程目录
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">挑选不同流程演示，快速跳转到对应该用场景。</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pipelinePreviews.map((pipeline) => (
              <Card 
                key={pipeline.id} 
                interactive 
                elevation="sm" 
                className="flex h-full flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{CATEGORY_LABEL[pipeline.category] ?? pipeline.category}</Badge>
                    <Badge tone="neutral">{DIFFICULTY_LABEL[pipeline.difficulty] ?? pipeline.difficulty}</Badge>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">{pipeline.name}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{pipeline.summary}</p>
                  <div className="mt-4 space-y-2">
                    {pipeline.highlights.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/pipelines/${pipeline.id}`}
                  className="group mt-6 flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                >
                  查看详情 
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Learning Path Section */}
        <motion.section variants={itemVariants} className="space-y-8">
           <div className="flex items-end justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                <GraduationCap className="h-6 w-6 text-emerald-500" />
                交互式学习路径
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">针对不同角色设计分级任务，可标记完成进度。</p>
            </div>
          </div>
          <LearningPathPlanner />
        </motion.section>

        {/* Bottom Grid: Resources & Tools */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Resources */}
          <motion.section variants={itemVariants} className="space-y-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <BookOpen className="h-5 w-5 text-amber-500" />
              资料与讲义集成
            </h2>
            <div className="grid gap-4">
              {knowledgeBase.map((resource) => (
                <ResourceCard key={resource.title} resource={resource} />
              ))}
            </div>
          </motion.section>

          {/* Lab Tools */}
          <motion.section variants={itemVariants} className="space-y-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <FlaskConical className="h-5 w-5 text-purple-500" />
              关联实验工具
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {labTools.map((tool) => (
                <Link key={tool.name} href={tool.href} className="block h-full">
                  <Card interactive elevation="sm" className="h-full">
                    <Badge tone="neutral" className="mb-2">{tool.tag}</Badge>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{tool.name}</h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  );
}
