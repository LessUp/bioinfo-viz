import type { Run, Step, Edge, Phase, RunStatus } from '../store/runStore'

function mapStatus(s?: string): RunStatus {
  switch (s) {
    case 'Submitted':
    case 'QueuedInCromwell':
    case 'Running':
    case 'Starting':
    case 'Queued':
      return 'Running'
    case 'Succeeded':
    case 'Done':
      return 'Succeeded'
    case 'Failed':
      return 'Failed'
    case 'Aborted':
      return 'Aborted'
    default:
      return 'Queued'
  }
}

function phaseOf(label: string): Phase {
  const x = label.toLowerCase()
  if (/(bwa|markdup|markduplicates|bqsr|recalibrator|applybqsr)/.test(x)) return 'Preprocess'
  if (/(haplotypecaller|hc)/.test(x)) return 'VariantCalling'
  if (/(genomicsdbimport|genotypegvcf|genotypegvcfs)/.test(x)) return 'JointGenotyping'
  if (/(vqsr|hardfilter|filter)/.test(x)) return 'Filtering'
  return 'Preprocess'
}

export async function fetchCromwellMetadata(
  baseUrl: string,
  workflowId: string,
  headers?: Record<string, string>
) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/workflows/v1/${workflowId}/metadata?expandSubWorkflows=true`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function normalizeCromwell(meta: any): Run {
  const calls: Record<string, any[]> = meta.calls || {}
  const steps: Step[] = []

  Object.entries(calls).forEach(([callName, attempts]) => {
    ;(attempts || []).forEach((a: any) => {
      const id = `${callName}${typeof a.shardIndex === 'number' ? `#${a.shardIndex}` : ''}${a.attempt ? `@${a.attempt}` : ''}`
      const label = callName.split('.').slice(-1)[0]
      const start = a.start || undefined
      const end = a.end || undefined
      const dur = start && end ? Date.parse(end) - Date.parse(start) : undefined
      steps.push({
        id,
        label,
        fqname: callName,
        phase: phaseOf(label),
        status: mapStatus(
          a.executionStatus ||
            a.executionStatusDescription ||
            (a.callCaching?.hit ? 'Succeeded' : meta.status)
        ),
        startTime: start,
        endTime: end,
        attempt: a.attempt,
        scatterIndex: typeof a.shardIndex === 'number' ? a.shardIndex : undefined,
        log: { stdoutUrl: a.stdout, stderrUrl: a.stderr },
        params: a.runtimeAttributes || undefined,
        inputs: a.inputs || undefined,
        outputs: a.outputs || undefined,
        metrics: dur ? { durationMs: dur } : undefined,
        messages: a.failures ? a.failures.map((f: any) => f.message).filter(Boolean) : undefined,
      })
    })
  })

  const name = meta.workflowName || meta.id
  const runStatus = mapStatus(meta.status)

  const edges = inferGermlineEdges(steps)

  const run: Run = {
    id: meta.id,
    name,
    pipeline: 'Germline',
    createdAt: meta.submitted || meta.start || new Date().toISOString(),
    updatedAt: meta.end || undefined,
    status: runStatus,
    steps,
    edges,
  }
  return run
}

function inferGermlineEdges(steps: Step[]): Edge[] {
  const find = (nameLike: RegExp) => steps.find((s) => nameLike.test(s.label))?.id
  const chain: Array<[RegExp, RegExp]> = [
    [/bwa|mem/i, /markdup|markduplicates/i],
    [/markdup|markduplicates/i, /bqsr|recalibrator/i],
    [/bqsr|recalibrator/i, /applybqsr/i],
    [/applybqsr/i, /haplotypecaller|hc/i],
    [/haplotypecaller|hc/i, /genomicsdbimport/i],
    [/genomicsdbimport/i, /genotypegvcf|genotypegvcfs/i],
    [/genotypegvcf|genotypegvcfs/i, /vqsr|hardfilter|filter/i],
  ]
  const edges: Edge[] = []
  chain.forEach(([a, b]) => {
    const from = find(a)
    const to = find(b)
    if (from && to) edges.push({ from, to })
  })
  return edges
}
