"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FlaskConical, GraduationCap, LayoutDashboard, Sparkles, Dna, Activity, Microscope } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LearningPathPlanner from '@/components/learning/LearningPathPlanner';
import ResourceCard from '@/components/pipeline/ResourceCard';
import Background from '@/components/layout/Background';
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

const CATEGORY_ICONS: Record<string, any> = {
  germline: Dna,
  transcriptomics: Activity,
  'single-cell': Microscope,
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
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(pipelinePreviews.map(p => p.category)))];

  const filteredPipelines = activeCategory === 'all' 
    ? pipelinePreviews 
    : pipelinePreviews.filter(p => p.category === activeCategory);

  return (
    <div className="relative min-h-screen">
      <Background />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-7xl flex-col gap-24 px-6 py-24 lg:px-8"
      >
        {/* Hero Section */}
        <motion.section variants={itemVariants} className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700 backdrop-blur-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
            >
              <Sparkles className="h-3 w-3" />
              BioInfo Visualizer Playbook
            </motion.div>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl">
              探索生物信息的
              <span className="mt-2 block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-teal-400">
                微观世界与宏大流程
              </span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              我们提供一站式的可视化教学与演示平台。从 BWA 比对算法的微观细节，到全基因组分析的宏大流程，通过交互式动画与实时仪表盘，让复杂的生物信息学变得触手可及。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={ROUTES.pipelines.wesGermline}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-1"
              >
                开始探索流程
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#learning-paths"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-8 py-4 text-sm font-bold text-zinc-700 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
              >
                定制学习路径
              </a>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
             <Card elevation="lg" className="relative z-10 overflow-hidden border-zinc-200/50 bg-white/80 p-8 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/80">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 text-white shadow-lg">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">平台亮点</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Feature Highlights</p>
                  </div>
                </div>
                <ul className="space-y-6">
                  {[
                    { title: '全流程可视化', desc: '覆盖 WES、RNA-Seq、单细胞等主流分析流程', icon: FlaskConical, color: 'text-blue-500' },
                    { title: '算法原理动画', desc: '深入浅出展示比对、组装等核心算法机制', icon: Dna, color: 'text-emerald-500' },
                    { title: '交互式学习', desc: '循序渐进的任务系统，记录你的每一步成长', icon: GraduationCap, color: 'text-amber-500' }
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                       <div className={cn("mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800", item.color)}>
                          <item.icon className="h-4 w-4" />
                       </div>
                       <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                       </div>
                    </li>
                  ))}
                </ul>
             </Card>
             {/* Decor elements */}
             <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-3xl" />
             <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 blur-3xl" />
          </div>
        </motion.section>

        {/* Pipeline Explorer */}
        <motion.section variants={itemVariants} className="space-y-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="flex items-center gap-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                <FlaskConical className="h-8 w-8 text-blue-500" />
                可视化流程演示
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                精选不同组学场景的经典流程，支持实时状态监控、关键指标查看与结果报告预览。
              </p>
            </div>
            
            <div className="flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-all",
                    activeCategory === cat
                      ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400"
                      : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                  )}
                >
                  {cat === 'all' ? '全部' : CATEGORY_LABEL[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPipelines.map((pipeline) => {
              const CategoryIcon = CATEGORY_ICONS[pipeline.category] || Activity;
              return (
                <Card 
                  key={pipeline.id} 
                  interactive 
                  elevation="md" 
                  className="group flex h-full flex-col justify-between overflow-hidden border-zinc-200 bg-white/50 backdrop-blur-sm transition-all hover:border-blue-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-blue-700"
                >
                  <div>
                    <div className="flex items-start justify-between">
                       <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                         <CategoryIcon className="h-6 w-6" />
                       </div>
                       <Badge tone="neutral" className="bg-zinc-100 dark:bg-zinc-800">{DIFFICULTY_LABEL[pipeline.difficulty] ?? pipeline.difficulty}</Badge>
                    </div>
                    
                    <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                      {pipeline.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-3">
                      {pipeline.summary}
                    </p>
                    
                    <div className="mt-6 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      {pipeline.highlights.slice(0, 3).map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <div className="mt-1.5 h-1 w-1 flex-none rounded-full bg-blue-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/pipelines/${pipeline.id}`}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-blue-600"
                  >
                    进入演示
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* Learning Path Section */}
        <motion.section id="learning-paths" variants={itemVariants} className="space-y-10 rounded-3xl bg-white/50 p-8 shadow-sm ring-1 ring-zinc-200/50 backdrop-blur-md lg:p-12 dark:bg-zinc-900/30 dark:ring-zinc-800/50">
           <div className="flex items-end justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <div className="max-w-2xl">
              <h2 className="flex items-center gap-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                <GraduationCap className="h-8 w-8 text-emerald-500" />
                交互式学习路径
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                为你规划清晰的学习路线图，从基础概念到实战演练，步步为营。
              </p>
            </div>
          </div>
          <LearningPathPlanner />
        </motion.section>

        {/* Resources & Tools */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Resources */}
          <motion.section variants={itemVariants} className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                知识库与讲义
              </h2>
            </div>
            <div className="grid gap-4">
              {knowledgeBase.map((resource) => (
                <ResourceCard key={resource.title} resource={resource} />
              ))}
            </div>
          </motion.section>

          {/* Lab Tools */}
          <motion.section variants={itemVariants} className="space-y-8">
             <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Microscope className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                独立实验工具
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {labTools.map((tool) => (
                <Link key={tool.name} href={tool.href} className="block h-full group">
                  <Card interactive elevation="sm" className="h-full border-zinc-200 bg-white/60 transition-all hover:border-purple-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-purple-700">
                    <div className="flex items-start justify-between mb-2">
                      <Badge tone="neutral" className="group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-300 transition-colors">{tool.tag}</Badge>
                      <ArrowRight className="h-4 w-4 text-zinc-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{tool.name}</h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
