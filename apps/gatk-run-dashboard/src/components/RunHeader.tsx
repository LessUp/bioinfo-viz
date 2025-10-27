import { useEffect, useState } from 'react'
import { useRunStore } from '../store/runStore'
import { exportReportPDF } from '../utils/exportReport'
import { parseNextflowTrace } from '../adapters/nextflow'
import { parseSnakemakeMetadata } from '../adapters/snakemake'

export function RunHeader() {
  const run = useRunStore(s => s.run)
  const view = useRunStore(s => s.view)
  const setView = useRunStore(s => s.setView)
  const loading = useRunStore(s => s.loading)
  const error = useRunStore(s => s.error)
  const loadFromCromwell = useRunStore(s => s.loadFromCromwell)
  const autoRefresh = useRunStore(s => s.autoRefresh)
  const setAutoRefresh = useRunStore(s => s.setAutoRefresh)
  const refreshOnce = useRunStore(s => s.refreshOnce)
  const autoRefreshInterval = useRunStore(s => s.autoRefreshInterval)
  const setAutoRefreshInterval = useRunStore(s => s.setAutoRefreshInterval)
  const authEnabled = useRunStore(s => s.authEnabled)
  const setAuthEnabled = useRunStore(s => s.setAuthEnabled)
  const authHeaderKey = useRunStore(s => s.authHeaderKey)
  const setAuthHeaderKey = useRunStore(s => s.setAuthHeaderKey)
  const authHeaderValue = useRunStore(s => s.authHeaderValue)
  const setAuthHeaderValue = useRunStore(s => s.setAuthHeaderValue)
  const timelineExport = useRunStore(s => s.timelineExport)
  const loadFromRun = useRunStore(s => s.loadFromRun)

  const [baseUrl, setBaseUrl] = useState('http://localhost:8000')
  const [workflowId, setWorkflowId] = useState('')
  const [useProxy, setUseProxy] = useState(true)

  // restore persisted settings
  useEffect(() => {
    try {
      const b = localStorage.getItem('gw_baseUrl')
      const w = localStorage.getItem('gw_workflowId')
      const p = localStorage.getItem('gw_useProxy')
      const ar = localStorage.getItem('gw_autoRefresh')
      const arInt = localStorage.getItem('gw_autoRefreshInterval')
      const ae = localStorage.getItem('gw_authEnabled')
      const ak = localStorage.getItem('gw_authHeaderKey')
      const av = localStorage.getItem('gw_authHeaderValue')
      if (b) setBaseUrl(b)
      if (w) setWorkflowId(w)
      if (p !== null) setUseProxy(p === '1')
      if (ar !== null) setAutoRefresh(ar === '1')
      if (arInt) setAutoRefreshInterval(Number(arInt) || 7000)
      if (ae !== null) setAuthEnabled(ae === '1')
      if (ak !== null) setAuthHeaderKey(ak)
      if (av !== null) setAuthHeaderValue(av)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist on change
  useEffect(() => { try { localStorage.setItem('gw_baseUrl', baseUrl) } catch {} }, [baseUrl])
  useEffect(() => { try { localStorage.setItem('gw_workflowId', workflowId) } catch {} }, [workflowId])
  useEffect(() => { try { localStorage.setItem('gw_useProxy', useProxy ? '1' : '0') } catch {} }, [useProxy])
  useEffect(() => { try { localStorage.setItem('gw_autoRefresh', autoRefresh ? '1' : '0') } catch {} }, [autoRefresh])
  useEffect(() => { try { localStorage.setItem('gw_autoRefreshInterval', String(autoRefreshInterval)) } catch {} }, [autoRefreshInterval])
  useEffect(() => { try { localStorage.setItem('gw_authEnabled', authEnabled ? '1' : '0') } catch {} }, [authEnabled])
  useEffect(() => { try { localStorage.setItem('gw_authHeaderKey', authHeaderKey) } catch {} }, [authHeaderKey])
  useEffect(() => { try { localStorage.setItem('gw_authHeaderValue', authHeaderValue) } catch {} }, [authHeaderValue])

  const stats = (() => {
    if (!run) return { total: 0, succeeded: 0, failed: 0, running: 0 }
    const total = run.steps.length
    const succeeded = run.steps.filter(s => s.status === 'Succeeded').length
    const failed = run.steps.filter(s => s.status === 'Failed').length
    const running = run.steps.filter(s => s.status === 'Running').length
    return { total, succeeded, failed, running }
  })()

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
      <div className="text-lg font-semibold">{run?.name ?? 'GATK Workflow'}</div>
      <div className="text-sm text-gray-500">{run?.pipeline ?? 'Germline'} · 状态：{run?.status ?? '—'}</div>
      <div className="flex items-center gap-2 text-sm">
        <input
          className="w-[240px] rounded border px-2 py-1 bg-transparent"
          placeholder="Cromwell 基地址，如 http://localhost:8000"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
        />
        <input
          className="w-[240px] rounded border px-2 py-1 bg-transparent"
          placeholder="workflowId"
          value={workflowId}
          onChange={e => setWorkflowId(e.target.value)}
        />
        <button
          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          disabled={!baseUrl || !workflowId || loading}
          onClick={() => loadFromCromwell(useProxy ? '/cromwell' : baseUrl, workflowId)}
        >{loading ? '加载中...' : '加载 Cromwell'}</button>
        {error ? <span className="text-red-600 ml-1">{error}</span> : null}
        <label className="inline-flex items-center gap-1 ml-2">
          <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} />
          使用开发代理
        </label>
        <label className="inline-flex items-center gap-1 ml-2">
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          自动刷新
        </label>
        <span className="ml-1">间隔(ms)</span>
        <input className="w-24 rounded border px-2 py-1 bg-transparent" type="number" min={1000} step={500} value={autoRefreshInterval}
          onChange={e => setAutoRefreshInterval(Number(e.target.value))} />
        <button className="px-2 py-1 rounded border" onClick={() => refreshOnce()}>
          手动刷新
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => timelineExport()}>
          导出时间轴 PNG
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => {
          if (!run) return
          const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${run.name || 'run'}.json`
          a.click()
          URL.revokeObjectURL(url)
        }}>
          导出运行 JSON
        </button>
        <label className="inline-flex items-center gap-1 ml-2">
          <input type="checkbox" checked={authEnabled} onChange={e => setAuthEnabled(e.target.checked)} />
          鉴权
        </label>
        <input className="w-36 rounded border px-2 py-1 bg-transparent" placeholder="Header Key" value={authHeaderKey}
          onChange={e => setAuthHeaderKey(e.target.value)} />
        <input className="w-52 rounded border px-2 py-1 bg-transparent" placeholder="Header Value" value={authHeaderValue}
          onChange={e => setAuthHeaderValue(e.target.value)} />
      </div>
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30">成功 {stats.succeeded}</span>
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30">运行中 {stats.running}</span>
        <span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30">失败 {stats.failed}</span>
        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-800/60">共 {stats.total}</span>
        <div className="ml-4 inline-flex rounded border border-gray-300 overflow-hidden">
          <button className={`px-3 py-1 ${view === 'dag' ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => setView('dag')}>DAG</button>
          <button className={`px-3 py-1 ${view === 'timeline' ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => setView('timeline')}>时间轴</button>
        </div>
        <button className="px-3 py-1 rounded border" onClick={() => exportReportPDF(run)}>
          导出报告 PDF
        </button>
        <label className="px-2 py-1 rounded border cursor-pointer">
          导入 Nextflow trace
          <input type="file" accept=".tsv,.txt" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const text = await f.text()
            const r = parseNextflowTrace(text)
            loadFromRun(r)
          }} />
        </label>
        <label className="px-2 py-1 rounded border cursor-pointer">
          导入 Snakemake JSON
          <input type="file" accept=".json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const text = await f.text()
            const r = parseSnakemakeMetadata(JSON.parse(text))
            loadFromRun(r)
          }} />
        </label>
      </div>
    </header>
  )
}
