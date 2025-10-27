import type { Run, Step, Edge, Phase, RunStatus } from '../store/runStore'

function mapStatus(s?: string): RunStatus {
  const x = (s || '').toLowerCase()
  if (x.includes('run') || x.includes('start')) return 'Running'
  if (x.includes('fail') || x.includes('error')) return 'Failed'
  if (x.includes('abort') || x.includes('cancel')) return 'Aborted'
  if (x.includes('done') || x.includes('success') || x.includes('complete')) return 'Succeeded'
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

export function parseSnakemakeMetadata(meta: any): Run {
  const steps: Step[] = []
  const edges: Edge[] = []
  const now = new Date().toISOString()
  const name = meta?.workflow || meta?.name || 'snakemake-run'
  if (Array.isArray(meta?.jobs)) {
    for (const j of meta.jobs) {
      const id = j.id || j.jobid || j.rule || String(steps.length + 1)
      const label = j.rule || j.name || id
      const start = j.start || j.started || undefined
      const end = j.end || j.finished || undefined
      steps.push({
        id: String(id),
        label: String(label),
        phase: phaseOf(String(label)),
        status: mapStatus(j.status || (end ? 'done' : start ? 'running' : 'queued')),
        startTime: start,
        endTime: end,
        attempt: j.attempts || j.attempt || undefined,
        inputs: j.input || j.inputs || undefined,
        outputs: j.output || j.outputs || undefined,
      })
      if (Array.isArray(j.depends_on)) {
        for (const d of j.depends_on) {
          edges.push({ from: String(d), to: String(id) })
        }
      }
    }
  } else if (Array.isArray(meta?.rules)) {
    for (const r of meta.rules) {
      const id = r.name || String(steps.length + 1)
      steps.push({ id, label: id, phase: phaseOf(id), status: 'Queued' })
    }
  }
  let runStatus: RunStatus = 'Queued'
  if (steps.some(s => s.status === 'Running')) runStatus = 'Running'
  if (steps.some(s => s.status === 'Failed')) runStatus = 'Failed'
  if (steps.length && steps.every(s => s.status === 'Succeeded')) runStatus = 'Succeeded'
  const run: Run = {
    id: 'snakemake-' + Date.now(),
    name,
    pipeline: 'Germline',
    createdAt: meta?.starttime || now,
    status: runStatus,
    steps,
    edges,
  }
  return run
}
