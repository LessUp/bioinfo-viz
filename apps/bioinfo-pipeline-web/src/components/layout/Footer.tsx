import Link from 'next/link';
import { Dna, Github, Twitter } from 'lucide-react';

const FOOTER_LINKS = [
  {
    title: '平台',
    links: [
      { label: '关于我们', href: '#' },
      { label: '更新日志', href: '#' },
      { label: '开源协议', href: '#' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '文档中心', href: '#' },
      { label: '示例数据', href: '#' },
      { label: '社区论坛', href: '#' },
    ],
  },
  {
    title: '更多',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'Twitter', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Dna className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                BioInfo<span className="text-blue-600">Viz</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              致力于打造最直观的生物信息学教学与演示平台，让复杂的算法与流程触手可及。
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-3">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} BioInfoViz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
