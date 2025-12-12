import { useEffect, useMemo, useState } from 'react'
import { useRunStore } from '../store/runStore'

export function StepDrawer() {
  const run = useRunStore((s) => s.run)
  const selectedStepId = useRunStore((s) => s.selectedStepId)
  const selectStep = useRunStore((s) => s.selectStep)

  const step = useMemo(() => run?.steps.find((s) => s.id === selectedStepId), [run, selectedStepId])
  const [stdout, setStdout] = useState<string | null>(null)
  const [stderr, setStderr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Array<{ name: string; url: string }>>([])

  useEffect(() => {
    if (!step) {
      setStdout(null)
      setStderr(null)
      setLoading(false)
      setLogError(null)
      setArtifacts([])
      return
    }
    setStdout(null)
    setStderr(null)
    setLoading(false)
    setLogError(null)
    try {
      const outs = step?.outputs || {}
      const list: Array<{ name: string; url: string }> = []
      const walk = (obj: any, prefix: string) => {
        if (!obj) return
        if (typeof obj === 'string') {
          const v = obj as string
          const isUrl = /^https?:\/\//i.test(v)
          const isPath =
            /\.(?:bam|bai|vcf(?:\.gz)?|tbi|cram|crai|fq(?:\.gz)?|fastq(?:\.gz)?|txt|log|json|csv|tsv|bed|png|jpg|svg)$/i.test(
              v
            )
          if (isUrl || isPath) list.push({ name: prefix, url: v })
          return
        }
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => walk(item, `${prefix}[${i}]`))
          return
        }
        if (typeof obj === 'object') {
          Object.entries(obj).forEach(([k, v]) => walk(v, prefix ? `${prefix}.${k}` : k))
        }
      }
      walk(outs, '')
      setArtifacts(list)
    } catch {
      setArtifacts([])
    }
  }, [step])

  const loadLogs = async () => {
    if (!step) return
    setLoading(true)
    setLogError(null)
    try {
      const fetchText = async (url?: string) => {
        if (!url) return null
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.text()
      }
      const [so, se] = await Promise.all([
        fetchText(step.log?.stdoutUrl),
        fetchText(step.log?.stderrUrl),
      ])
      setStdout(so)
      setStderr(se)
    } catch (e: any) {
      setLogError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!step) return null

  return (
    <aside className="w-[380px] shrink-0 border-l border-gray-200 dark:border-gray-800 p-4 overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">{step.label}</h2>
        <button className="text-sm px-2 py-1 border rounded" onClick={() => selectStep(null)}>
          关闭
        </button>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-gray-500">基本信息</div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <div className="text-gray-500">ID</div>
            <div className="break-all">{step.id}</div>
            <div className="text-gray-500">阶段</div>
            <div>{step.phase}</div>
            <div className="text-gray-500">状态</div>
            <div>{step.status}</div>
            <div className="text-gray-500">开始</div>
            <div>{step.startTime || '—'}</div>
            <div className="text-gray-500">结束</div>
            <div>{step.endTime || '—'}</div>
            <div className="text-gray-500">尝试</div>
            <div>{step.attempt ?? 1}</div>
            <div className="text-gray-500">scatter</div>
            <div>{step.scatterIndex ?? '—'}</div>
          </div>
        </div>
        <div>
          <div className="text-gray-500">资源与指标</div>
          <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded overflow-auto">
            {JSON.stringify(step.metrics ?? {}, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-gray-500">参数</div>
          <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded overflow-auto">
            {JSON.stringify(step.params ?? {}, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-gray-500">输入</div>
          <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded overflow-auto">
            {JSON.stringify(step.inputs ?? {}, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-gray-500">输出</div>
          <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded overflow-auto">
            {JSON.stringify(step.outputs ?? {}, null, 2)}
          </pre>
        </div>
        {artifacts.length > 0 && (
          <div>
            <div className="text-gray-500">工件</div>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              {artifacts.map((a, i) => (
                <li key={i} className="break-all">
                  <a className="text-blue-600 underline" href={a.url} target="_blank">
                    {a.name || a.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <div className="text-gray-500 flex items-center gap-2">
            <span>日志</span>
            {step.log?.stdoutUrl || step.log?.stderrUrl ? (
              <>
                <button
                  className="px-2 py-0.5 border rounded"
                  onClick={loadLogs}
                  disabled={loading}
                >
                  {loading ? '加载中…' : stdout || stderr ? '刷新' : '加载'}
                </button>
                {logError ? <span className="text-red-600">{logError}</span> : null}
              </>
            ) : null}
          </div>
          <div className="mt-1 space-y-2">
            {!step.log?.stdoutUrl && !step.log?.stderrUrl && (
              <div className="text-gray-400">暂无</div>
            )}
            {stdout !== null && (
              <div>
                <div className="text-gray-500">stdout</div>
                <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded max-h-56 overflow-auto whitespace-pre-wrap break-all">
                  {stdout || '(空)'}
                </pre>
              </div>
            )}
            {stderr !== null && (
              <div>
                <div className="text-gray-500">stderr</div>
                <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/30 rounded max-h-56 overflow-auto whitespace-pre-wrap break-all">
                  {stderr || '(空)'}
                </pre>
              </div>
            )}
            {stdout === null && step.log?.stdoutUrl && (
              <a
                className="text-blue-600 underline break-all block"
                href={step.log.stdoutUrl}
                target="_blank"
              >
                在新标签打开 stdout
              </a>
            )}
            {stderr === null && step.log?.stderrUrl && (
              <a
                className="text-blue-600 underline break-all block"
                href={step.log.stderrUrl}
                target="_blank"
              >
                在新标签打开 stderr
              </a>
            )}
          </div>
        </div>
        {step.messages?.length ? (
          <div>
            <div className="text-gray-500">消息</div>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              {step.messages!.map((m, i) => (
                <li key={i} className="break-all">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
