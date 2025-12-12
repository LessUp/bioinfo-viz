import type { ResourceLink } from '@/types/pipeline'
import { ROUTES } from '@/lib/routes'

export interface LearningStep {
  id: string
  title: string
  description: string
  target?: string
  resources?: ResourceLink[]
}

export interface LearningPath {
  id: string
  label: string
  summary: string
  persona: string
  skillFocus: string[]
  steps: LearningStep[]
}

const docsResource: ResourceLink = {
  title: 'NGS 流程入门讲义',
  description: '复习测序流程与数据格式，建立知识背景。',
  href: ROUTES.docs.ngsAnalysisGuide,
  kind: 'doc',
}

const bwaResource: ResourceLink = {
  title: 'BWA 算法交互演示',
  description: '通过动画掌握种子比对与评分矩阵。',
  href: ROUTES.apps.bwaAlgorithmViz,
  kind: 'app',
}

const gatkResource: ResourceLink = {
  title: 'GATK 运行监控',
  description: '观察流程监控指标与日志。',
  href: ROUTES.apps.gatkRunDashboard,
  kind: 'app',
}

const slidesResource: ResourceLink = {
  title: 'NGS vs TGS 幻灯片',
  description: '课堂可直接引用的比较幻灯片。',
  href: ROUTES.slides.ngsVsTgs,
  kind: 'doc',
}

export const learningPaths: LearningPath[] = [
  {
    id: 'beginner',
    label: '入门自学者',
    persona: '没有流程经验，希望了解基础概念和核心步骤。',
    summary: '以 Picard/GATK 经典流程为主线，理解测序数据处理的整体框架。',
    skillFocus: ['基础术语', '流程导航', '质量评估'],
    steps: [
      {
        id: 'read-docs',
        title: '阅读 NGS 流程讲义',
        description: '先熟悉测序数据的生成、FASTQ 结构以及常见质控指标。',
        resources: [docsResource, slidesResource],
      },
      {
        id: 'picard',
        title: '体验 Picard 可视化',
        description: '在 Picard Workflow SPA 中逐步浏览去重、重校正等操作。',
        target: ROUTES.apps.picardWorkflowSpa,
      },
      {
        id: 'pipeline-demo',
        title: '跟随 WES 全流程演示',
        description: '通过本应用的 “外显子组变异检测” 模块掌握运行状态与报告。',
        target: ROUTES.pipelines.wesGermline,
        resources: [bwaResource],
      },
    ],
  },
  {
    id: 'researcher',
    label: '研究生/科研人员',
    persona: '具备基础技能，希望拓展到转录组或单细胞场景。',
    summary: '组合转录组差异分析与富集、单细胞聚类案例，强化数据解读。',
    skillFocus: ['表达定量', '统计推断', '可视化解读'],
    steps: [
      {
        id: 'rna-seq',
        title: 'Bulk RNA-Seq 流程',
        description: '在 “差异表达” 模块中查看定量与差异分析阶段的指标。',
        target: ROUTES.pipelines.bulkRnaSeq,
        resources: [gatkResource],
      },
      {
        id: 'gene-enrich',
        title: '探索富集分析',
        description: '结合 GATK dashboard 或外部工具，解释 GO/KEGG 通路结果。',
        target: ROUTES.apps.gatkRunDashboard,
      },
      {
        id: 'slides',
        title: '整理教学材料',
        description: '引用现成幻灯片和讲义，搭建课程汇报框架。',
        resources: [slidesResource],
      },
    ],
  },
  {
    id: 'engineer',
    label: '工程实践者',
    persona: '负责流程上线或自动化，需要关注监控、数据接口。',
    summary: '强调 Mock API、统一组件与数据规范，方便将演示迁移到生产环境。',
    skillFocus: ['API 设计', '监控指标', '组件复用'],
    steps: [
      {
        id: 'api-contract',
        title: '熟悉 Mock API 与数据结构',
        description: '阅读项目源码中的 pipeline-presets、了解数据契约。',
        target: ROUTES.external.repo,
      },
      {
        id: 'monitor',
        title: 'GATK 运行监控',
        description: '查看实时指标与日志，思考接入 Prometheus/Grafana 的方式。',
        target: ROUTES.apps.gatkRunDashboard,
      },
      {
        id: 'component-system',
        title: '复用 UI 组件',
        description: '分析 Card/Badge 等组件如何统一风格，规划自己的组件库。',
        resources: [docsResource],
      },
    ],
  },
]

export function getLearningPath(id: string) {
  return learningPaths.find((p) => p.id === id) ?? learningPaths[0]
}
