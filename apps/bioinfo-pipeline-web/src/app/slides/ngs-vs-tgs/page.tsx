import Link from 'next/link'

export default function NgsVsTgsSlidesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">NGS vs TGS 幻灯片</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        本仓库中的 NGS vs TGS 演示幻灯片位于根目录的 slides/ngs-vs-tgs
        子模块内，是一个独立的静态站点。
      </p>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>在本地查看幻灯片的推荐方式：</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>在终端切换到仓库根目录。</li>
          <li>
            进入 <span className="font-mono text-xs">slides/ngs-vs-tgs</span>{' '}
            目录后，使用任意静态服务（例如 <span className="font-mono text-xs">npx serve .</span> 或{' '}
            <span className="font-mono text-xs">python -m http.server 8000</span>）。
          </li>
          <li>
            在浏览器中访问对应端口，例如{' '}
            <span className="font-mono text-xs">http://localhost:8000</span>。
          </li>
        </ol>
      </section>
      <section className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          在本 Next.js 演示应用中，这里主要作为说明入口，方便从首页统一跳转到 slides
          模块的使用指南。
        </p>
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
