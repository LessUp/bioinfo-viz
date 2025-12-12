import type { Run, Step, Edge, Phase, RunStatus } from '../store/runStore'

function mapStatus(s?: string): RunStatus {
  const x = (s || '').toLowerCase()
  if (x === 'running' || x === 'submitted' || x === 'pending') return 'Running'
  if (x === 'failed' || x === 'error') return 'Failed'
  if (x === 'aborted' || x === 'cancelled') return 'Aborted'
  if (x === 'completed' || x === 'succeeded' || x === 'done') return 'Succeeded'
  return 'Queued'
}

function phaseOf(label: string): Phase {
  const x = label.toLowerCase()
  if (/(bwa|markdup|markduplicates|bqsr|recalibrator|applybqsr)/.test(x)) return 'Preprocess'
  if (/(haplotypecaller|hc)/.test(x)) return 'VariantCalling'
  if (/(genomicsdbimport|genotypegvcf|genotypegvcfs)/.test(x)) return 'JointGenotyping'
  if (/(vqsr|hardfilter|filter)/.test(x)) return 'Filtering'
  return 'Preprocess'
}

export function parseNextflowTrace(text: string): Run {
  const lines = (text || '').split(/\r?\n/).filter(Boolean)
  if (!lines.length)
    return {
      id: 'nextflow-empty',
      name: 'nextflow',
      pipeline: 'Germline',
      createdAt: new Date().toISOString(),
      status: 'Queued',
      steps: [],
      edges: [],
    }
  const headers = lines[0].split(/\t/)
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name)
  const iProcess = idx('process')
  const iTaskId = idx('task_id') >= 0 ? idx('task_id') : idx('hash')
  const iStatus = idx('status')
  const iStart = idx('start') >= 0 ? idx('start') : idx('submit')
  const iEnd = idx('complete') >= 0 ? idx('complete') : idx('end')
  const iAttempt = idx('attempt')
  const steps: Step[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/\t/)
    const process = cols[iProcess] || `task-${i}`
    const taskId = cols[iTaskId] || String(i)
    const status = mapStatus(cols[iStatus])
    const start = cols[iStart]
    const end = cols[iEnd]
    steps.push({
      id: `${process}@${taskId}`,
      label: process,
      phase: phaseOf(process),
      status,
      startTime: start || undefined,
      endTime: end || undefined,
      attempt: iAttempt >= 0 ? Number(cols[iAttempt] || '1') : undefined,
    })
  }
  let runStatus: RunStatus = 'Succeeded'
  if (steps.some((s) => s.status === 'Failed')) runStatus = 'Failed'
  else if (steps.some((s) => s.status === 'Running')) runStatus = 'Running'
  else if (steps.every((s) => s.status === 'Queued')) runStatus = 'Queued'
  const run: Run = {
    id: 'nextflow-' + Date.now(),
    name: 'nextflow-run',
    pipeline: 'Germline',
    createdAt: new Date().toISOString(),
    status: runStatus,
    steps,
    edges: [] as Edge[],
  }
  return run
}
