import { useEffect, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useRunStore } from '../store/runStore'

function toMs(t?: string) { return t ? Date.parse(t) : undefined }
function minutes(ms: number) { return ms / 60000 }

const statusColors: Record<string, string> = {
  Queued: '#a3a3a3',
  Running: '#60a5fa',
  Succeeded: '#22c55e',
  Failed: '#ef4444',
  Aborted: '#f59e0b',
}
const colorFor = (status: string) => statusColors[status] ?? '#9ca3af'

export function TimelineView() {
  const run = useRunStore(s => s.run)
  const searchText = useRunStore(s => s.searchText).toLowerCase()
  const statusFilter = useRunStore(s => s.statusFilter)
  const selectStep = useRunStore(s => s.selectStep)
  const setTimelineExporter = useRunStore(s => s.setTimelineExporter)
  const chartRef = useRef<ReactECharts>(null)
  const [winStart, setWinStart] = useState(0)
  const [winSize, setWinSize] = useState(300)

  const steps = useMemo(() => {
    if (!run) return []
    return run.steps.filter(s => {
      const matchText = !searchText || s.label.toLowerCase().includes(searchText) || s.id.toLowerCase().includes(searchText)
      const matchStatus = statusFilter === 'All' || s.status === statusFilter
      return matchText && matchStatus
    })
  }, [run, searchText, statusFilter])

  if (!run) return <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>

  const rows = steps.map(s => {
    const start = toMs(s.startTime)
    const end = toMs(s.endTime) ?? Date.now()
    return start ? { id: s.id, label: s.label, status: s.status, start, end } : null
  }).filter(Boolean) as { id: string; label: string; status: string; start: number; end: number }[]

  if (!rows.length) return <div className="h-full flex items-center justify-center text-gray-500">暂无可绘制的时间数据</div>

  const minStart = Math.min(...rows.map(r => r.start))
  const maxEnd = Math.max(...rows.map(r => r.end))
  const totalMin = Math.max(1, minutes(maxEnd - minStart))

  const totalRows = rows.length
  const shouldWindow = totalRows > 600
  const start = shouldWindow ? Math.min(winStart, Math.max(0, totalRows - 1)) : 0
  const size = shouldWindow ? Math.min(winSize, Math.max(50, totalRows - start)) : totalRows
  const viewRows = rows.slice(start, start + size)
  const yCats = viewRows.map(r => r.label)
  const offsets = viewRows.map(r => Number(minutes(r.start - minStart).toFixed(2)))
  const durations = viewRows.map(r => Math.max(0.2, Number(minutes(r.end - r.start).toFixed(2))))

  const option = {
    animation: false,
    grid: { top: 28, left: 140, right: 24, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const idx = params?.[1]?.dataIndex ?? params?.[0]?.dataIndex
        if (idx == null) return ''
        const r = viewRows[idx]
        const fmt = (ms: number) => new Date(ms).toLocaleString()
        return `${r.label}<br/>状态：${r.status}<br/>开始：${fmt(r.start)}<br/>结束：${fmt(r.end)}<br/>耗时：${Number(durations[idx]).toFixed(1)}m`
      }
    },
    dataZoom: [
      { type: 'slider', xAxisIndex: 0 },
      { type: 'inside', xAxisIndex: 0 }
    ],
    xAxis: { type: 'value', name: '分钟', min: 0, max: Number((totalMin * 1.05).toFixed(2)) },
    yAxis: { type: 'category', data: yCats, inverse: true },
    series: [
      {
        name: 'offset', type: 'bar', stack: 'time', itemStyle: { color: 'transparent' }, emphasis: { disabled: true },
        data: offsets
      },
      {
        name: 'duration', type: 'bar', stack: 'time', progressive: 2000,
        data: durations.map((v, i) => ({ value: v, itemStyle: { color: colorFor(viewRows[i].status) } })),
        label: { show: true, position: 'right', formatter: ({ value }: any) => `${Number(value).toFixed(1)}m` }
      }
    ]
  }

  const h = Math.max(320, viewRows.length * 34)
  const onEvents = {
    click: (params: any) => {
      if (params?.seriesName !== 'duration') return
      const idx = params?.dataIndex
      if (typeof idx !== 'number') return
      const row = viewRows[idx]
      if (row?.id) selectStep(row.id)
    }
  }
  useEffect(() => {
    setTimelineExporter(() => () => {
      const inst: any = chartRef.current?.getEchartsInstance?.()
      if (!inst) return
      const url = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
      const a = document.createElement('a')
      a.href = url
      a.download = `${run?.name || 'timeline'}.png`
      a.click()
    })
    return () => setTimelineExporter(null)
  }, [setTimelineExporter, run?.name])

  return (
    <div className="h-full overflow-auto">
      {shouldWindow && (
        <div className="flex items-center gap-2 px-2 py-1 text-sm">
          <span>行窗口</span>
          <span>起始</span>
          <input className="w-20 rounded border px-2 py-1 bg-transparent" type="number" min={0} max={Math.max(0, totalRows-1)} value={start} onChange={e => setWinStart(Number(e.target.value) || 0)} />
          <span>大小</span>
          <input className="w-20 rounded border px-2 py-1 bg-transparent" type="number" min={50} max={totalRows} value={size} onChange={e => setWinSize(Number(e.target.value) || 300)} />
          <span>总计 {totalRows}</span>
        </div>
      )}
      <ReactECharts ref={chartRef as any} option={option} notMerge style={{ height: h }} onEvents={onEvents} />
    </div>
  )
}
