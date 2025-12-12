import Link from 'next/link'

const APP_CONFIG: Record<string, { title: string; description: string; commands: string[] }> = {
  'picard-workflow-spa': {
    title: 'Picard Workflow SPA',
    description: 'Picard 流程的静态单页演示，展示去重、重校正等步骤。',
    commands: ['在仓库根目录运行：', 'npm run dev:picard'],
  },
  'bwa-algorithm-viz': {
    title: 'BWA 算法动画',
    description: '通过动画理解比对算法的种子扩展与评分策略。',
    commands: ['在仓库根目录运行：', 'npm run dev:bwa'],
  },
  'arith-compress-viz': {
    title: '算术编码演示',
    description: '演示算术编码过程的静态页面。',
    commands: ['在仓库根目录运行：', 'npm run dev:arith'],
  },
  'smith-waterman-viz': {
    title: 'SW/NW 序列比对演示',
    description: '动态规划矩阵填充与回溯路径的算法可视化。',
    commands: [
      '在终端切换到：apps/smith-waterman-viz',
      '使用静态服务启动，例如：',
      'npx serve .  或  python -m http.server 8000',
    ],
  },
  'debruijn-viz': {
    title: 'de Bruijn 图演示',
    description: 'k-mer 分解、图构建与路径查找的静态可视化页面。',
    commands: [
      '在终端切换到：apps/debruijn-viz',
      '使用静态服务启动，例如：',
      'npx serve .  或  python -m http.server 8000',
    ],
  },
  'gatk-run-dashboard': {
    title: 'GATK 运行监控仪表盘',
    description: '基于 Vite + React 的 GATK/Cromwell 运行可视化与监控面板。',
    commands: ['在仓库根目录运行：', 'npm run dev:gatk', '默认端口：5176（预览 5177）'],
  },
  'genome-align-viz': {
    title: '基因比对动态可视化',
    description: '展示对齐片段、覆盖度、变异和日志的实时可视化。',
    commands: ['在仓库根目录运行：', 'npm run dev:align', '默认端口：5173（预览 5174）'],
  },
}

export default function AppBridgePage({ params }: { params: { slug: string } }) {
  const config = APP_CONFIG[params.slug]

  if (!config) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">未识别的子应用</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          当前路径对应的子应用在本教学项目中尚未配置说明，请在仓库的 apps 目录中查看可用模块。
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{config.title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {config.description}
      </p>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>在本地启动该子应用的推荐步骤：</p>
        <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {config.commands.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </section>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>启动后，可在浏览器中访问对应端口查看完整交互式演示。</p>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          返回首页
        </Link>
      </div>
    </main>
  )
}
