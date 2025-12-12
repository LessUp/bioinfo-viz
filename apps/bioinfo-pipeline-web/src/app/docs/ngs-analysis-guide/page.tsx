import Link from 'next/link'

export default function NgsAnalysisGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">NGS 分析流程讲义</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        本页面是对仓库根目录 docs/ngs-analysis-guide.md 的入口说明。完整内容包含 Mermaid
        流程图和详细文字讲解，适合作为课堂讲义或自学资料。
      </p>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>要查看原始 Markdown 文件，可以在本地按以下方式操作：</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            在代码编辑器中打开 <span className="font-mono text-xs">docs/ngs-analysis-guide.md</span>
            。
          </li>
          <li>或在支持 Mermaid 的 Markdown 预览工具中打开，以渲染流程图。</li>
        </ol>
      </section>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>你也可以从首页或学习路径模块回到其它演示：</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>在首页的“资料与讲义集成”区域点击本讲义卡片。</li>
          <li>在“交互式学习路径”中，从入门路径的第一步开始阅读。</li>
        </ul>
      </section>
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
