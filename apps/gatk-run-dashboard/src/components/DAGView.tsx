import { useMemo, useCallback } from 'react'
import ReactFlow, { Background, Controls, Node, Edge as RFEdge, MiniMap } from 'reactflow'
import { useRunStore, Step } from '../store/runStore'
import dagre from 'dagre'

const statusBg = (s: Step['status']) => ({
  Queued: '#f3f4f6',
  Running: '#dbeafe',
  Succeeded: '#dcfce7',
  Failed: '#fee2e2',
  Aborted: '#fef3c7',
}[s])

export function DAGView() {
  const run = useRunStore(s => s.run)
  const selectStep = useRunStore(s => s.selectStep)
  const searchText = useRunStore(s => s.searchText).toLowerCase()
  const statusFilter = useRunStore(s => s.statusFilter)
  const selectedId = useRunStore(s => s.selectedStepId)
  const groupScatter = useRunStore(s => s.groupScatter)
  const groupSubWorkflows = useRunStore(s => s.groupSubWorkflows)

  const filteredSteps = useMemo(() => {
    if (!run) return [] as Step[]
    return run.steps.filter(s => {
      const matchText = !searchText || s.label.toLowerCase().includes(searchText) || s.id.toLowerCase().includes(searchText)
      const matchStatus = statusFilter === 'All' || s.status === statusFilter
      return matchText && matchStatus
    })
  }, [run, searchText, statusFilter])

  const nodes = useMemo(() => {
    if (!run) return [] as Node[]
    const order: Record<Step['phase'], number> = {
      Preprocess: 0,
      VariantCalling: 1,
      JointGenotyping: 2,
      Filtering: 3,
    }
    const counts: Record<Step['phase'], number> = { Preprocess: 0, VariantCalling: 0, JointGenotyping: 0, Filtering: 0 }
    const colWidth = 280
    const rowHeight = 120
    const upstream = new Set<string>()
    const downstream = new Set<string>()
    if (selectedId) {
      const adjIn = new Map<string, string[]>()
      const adjOut = new Map<string, string[]>()
      for (const e of run.edges) {
        if (!adjOut.has(e.from)) adjOut.set(e.from, [])
        adjOut.get(e.from)!.push(e.to)
        if (!adjIn.has(e.to)) adjIn.set(e.to, [])
        adjIn.get(e.to)!.push(e.from)
      }
      const dfs = (start: string, map: Map<string, string[]>, set: Set<string>) => {
        const stack = [start]
        const seen = new Set<string>([start])
        while (stack.length) {
          const cur = stack.pop()!
          for (const nxt of map.get(cur) || []) {
            if (!seen.has(nxt)) { seen.add(nxt); set.add(nxt); stack.push(nxt) }
          }
        }
      }
      dfs(selectedId, adjIn, upstream)
      dfs(selectedId, adjOut, downstream)
    }

    const makeStyledNode = (id: string, label: string, status: Step['status'], hidden: boolean, isSelected: boolean, isNeighbor: boolean, pos?: {x:number;y:number}) => {
      const dimmed = selectedId && !isSelected && !isNeighbor
      return {
        id,
        data: { label },
        position: pos || { x: 0, y: 0 },
        style: {
          background: statusBg(status),
          border: isSelected ? '2px solid #111827' : isNeighbor ? '2px dashed #6b7280' : '1px solid #e5e7eb',
          opacity: dimmed ? 0.4 : 1,
          display: hidden ? 'none' : 'block'
        },
      } as Node
    }

    if (!groupScatter && !groupSubWorkflows) {
      const g = new dagre.graphlib.Graph()
      g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })
      g.setDefaultEdgeLabel(() => ({}))
      const nodeIds = run.steps.map(s => s.id)
      nodeIds.forEach(id => g.setNode(id, { width: 200, height: 60 }))
      run.edges.forEach(e => g.setEdge(e.from, e.to))
      dagre.layout(g)
      return run.steps.map((s) => {
        const hidden = !filteredSteps.includes(s)
        const isSelected = selectedId === s.id
        const isNeighbor = upstream.has(s.id) || downstream.has(s.id)
        const n = g.node(s.id)
        return makeStyledNode(s.id, s.label, s.status, hidden, isSelected, isNeighbor, { x: n?.x ?? 0, y: n?.y ?? 0 })
      })
    }
    const groupOf = (s: Step) => {
      if (groupScatter && s.scatterIndex !== undefined) return `${s.label}[*]`
      if (groupSubWorkflows && s.fqname && s.fqname.includes('.')) return s.fqname.split('.').slice(0, -1).join('.') + '::{group}'
      return s.id
    }
    const groupPhase = new Map<string, Step['phase']>()
    const groupMembers = new Map<string, Step[]>()
    const visibleGroups = new Set<string>()
    for (const s of run.steps) {
      const g = groupOf(s)
      if (!groupMembers.has(g)) groupMembers.set(g, [])
      groupMembers.get(g)!.push(s)
      if (!groupPhase.has(g)) groupPhase.set(g, s.phase)
    }
    for (const s of filteredSteps) {
      visibleGroups.add(groupOf(s))
    }
    const nodes: Node[] = []
    for (const [g, members] of groupMembers.entries()) {
      const phase = groupPhase.get(g) as Step['phase']
      const isSelected = selectedId ? members.some(m => m.id === selectedId) : false
      const isNeighbor = selectedId ? members.some(m => upstream.has(m.id) || downstream.has(m.id)) : false
      const hidden = !visibleGroups.has(g)
      const label = members[0]?.label + (members.some(m => m.scatterIndex !== undefined) ? ' [scatter]' : '')
      nodes.push(makeStyledNode(g, label, members[0]?.status || 'Queued', hidden, isSelected, isNeighbor))
    }
    const ggraph = new dagre.graphlib.Graph()
    ggraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })
    ggraph.setDefaultEdgeLabel(() => ({}))
    nodes.forEach(n => ggraph.setNode(n.id, { width: 220, height: 60 }))
    const groupOfId = (id: string) => {
      const s = run.steps.find(x => x.id === id)
      if (!s) return id
      if (groupScatter && s.scatterIndex !== undefined) return `${s.label}[*]`
      if (groupSubWorkflows && s.fqname && s.fqname.includes('.')) return s.fqname.split('.').slice(0, -1).join('.') + '::{group}'
      return s.id
    }
    const seen = new Set<string>()
    for (const e of run.edges) {
      const gs = groupOfId(e.from)
      const gt = groupOfId(e.to)
      const key = gs + '>' + gt
      if (gs === gt || seen.has(key)) continue
      seen.add(key)
      ggraph.setEdge(gs, gt)
    }
    dagre.layout(ggraph)
    return nodes.map(n => {
      const p = ggraph.node(n.id)
      return { ...n, position: { x: p?.x ?? 0, y: p?.y ?? 0 } }
    })
  }, [run, filteredSteps, selectedId, groupScatter, groupSubWorkflows])

  const edges = useMemo(() => {
    if (!run) return [] as RFEdge[]
    const visible = new Set(filteredSteps.map(s => s.id))
    const upstream = new Set<string>()
    const downstream = new Set<string>()
    if (selectedId) {
      const adjIn = new Map<string, string[]>()
      const adjOut = new Map<string, string[]>()
      for (const e of run.edges) {
        if (!adjOut.has(e.from)) adjOut.set(e.from, [])
        adjOut.get(e.from)!.push(e.to)
        if (!adjIn.has(e.to)) adjIn.set(e.to, [])
        adjIn.get(e.to)!.push(e.from)
      }
      const dfs = (start: string, map: Map<string, string[]>, set: Set<string>) => {
        const stack = [start]
        const seen = new Set<string>([start])
        while (stack.length) {
          const cur = stack.pop()!
          for (const nxt of map.get(cur) || []) {
            if (!seen.has(nxt)) { seen.add(nxt); set.add(nxt); stack.push(nxt) }
          }
        }
      }
      dfs(selectedId, adjIn, upstream)
      dfs(selectedId, adjOut, downstream)
    }
    if (!groupScatter) {
      return run.edges
        .filter(e => visible.has(e.from) && visible.has(e.to))
        .map((e, i) => ({
          id: `e-${i}`,
          source: e.from,
          target: e.to,
          style: selectedId && (e.from === selectedId || e.to === selectedId || upstream.has(e.from) || downstream.has(e.to))
            ? { stroke: '#111827', strokeWidth: 2 }
            : undefined,
        }))
    }
    const groupOfId = (id: string) => {
      const s = run.steps.find(x => x.id === id)
      if (!s) return id
      return s.scatterIndex !== undefined ? `${s.label}[*]` : s.id
    }
    const gVisible = new Set<string>()
    for (const s of filteredSteps) gVisible.add(groupOfId(s.id))
    const seen = new Set<string>()
    const out: RFEdge[] = []
    for (const e of run.edges) {
      const gs = groupOfId(e.from)
      const gt = groupOfId(e.to)
      if (!gVisible.has(gs) || !gVisible.has(gt)) continue
      const key = gs + '>' + gt
      if (seen.has(key)) continue
      seen.add(key)
      const highlight = selectedId ? (groupOfId(selectedId) === gs || groupOfId(selectedId) === gt) : false
      out.push({ id: `e-${out.length}`, source: gs, target: gt, style: highlight ? { stroke: '#111827', strokeWidth: 2 } : undefined })
    }
    return out
  }, [run, filteredSteps, selectedId, groupScatter, groupSubWorkflows])

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (!run) return
    if (!groupScatter && !groupSubWorkflows) { selectStep(node.id); return }
    if (groupScatter && node.id.endsWith('[*]')) {
      const label = node.data?.label?.replace(/ \[scatter\]$/, '') || ''
      const found = run.steps.find(s => s.label === label && s.scatterIndex !== undefined)
      selectStep(found?.id || null)
      return
    }
    if (groupSubWorkflows && node.id.endsWith('::{group}')) {
      const prefix = node.id.replace(/::\{group\}$/, '')
      const found = run.steps.find(s => s.fqname?.startsWith(prefix + '.'))
      selectStep(found?.id || null)
      return
    }
    selectStep(node.id)
  }, [selectStep, run, groupScatter, groupSubWorkflows])
  const onPaneClick = useCallback(() => {
    selectStep(null)
  }, [selectStep])

  if (!run) return <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>

  return (
    <div className="h-full">
      <ReactFlow nodes={nodes} edges={edges} onNodeClick={onNodeClick} onPaneClick={onPaneClick} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
