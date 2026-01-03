import Link from 'next/link'
import { withBasePath } from '@/lib/base-path'

export default function NgsVsTgsSlidesPage() {
  const slidesUrl = withBasePath('/static/slides/ngs-vs-tgs/index.html')

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            NGS vs TGS 幻灯片
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            这是一个独立的静态幻灯片站点，已纳入统一门户的静态资源路径。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={slidesUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新标签打开
          </a>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            返回首页
          </Link>
        </div>
      </div>

      <section className="mt-6">
        <div className="rounded-xl border border-zinc-200 bg-white/60 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <iframe
            title="NGS vs TGS"
            src={slidesUrl}
            className="h-[75vh] w-full rounded-lg bg-white dark:bg-black"
          />
        </div>
      </section>

      <section className="mt-8 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>在本地查看幻灯片的推荐方式：</p>
        <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div>在仓库根目录运行：</div>
          <div>npm run dev:slides</div>
        </div>
      </section>
    </main>
  )
}
