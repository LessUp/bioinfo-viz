import { useRunStore } from '../store/runStore'

export function Filters() {
  const searchText = useRunStore(s => s.searchText)
  const setSearchText = useRunStore(s => s.setSearchText)
  const statusFilter = useRunStore(s => s.statusFilter)
  const setStatusFilter = useRunStore(s => s.setStatusFilter)
  const groupScatter = useRunStore(s => s.groupScatter)
  const setGroupScatter = useRunStore(s => s.setGroupScatter)
  const groupSubWorkflows = useRunStore(s => s.groupSubWorkflows)
  const setGroupSubWorkflows = useRunStore(s => s.setGroupSubWorkflows)

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium mb-1">搜索步骤</div>
        <input
          className="w-full rounded border px-2 py-1 text-sm bg-transparent"
          placeholder="输入步骤名或关键字"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-1">状态筛选</div>
        <select className="w-full rounded border px-2 py-1 text-sm bg-transparent" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}>
          <option>All</option>
          <option>Queued</option>
          <option>Running</option>
          <option>Succeeded</option>
          <option>Failed</option>
          <option>Aborted</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={groupScatter} onChange={e => setGroupScatter(e.target.checked)} />
        Scatter 分组折叠
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={groupSubWorkflows} onChange={e => setGroupSubWorkflows(e.target.checked)} />
        子工作流分组折叠
      </label>
      <p className="text-xs text-gray-500">更多筛选项（阶段、耗时、重试次数等）可在后续迭代中补充。</p>
    </div>
  )
}
