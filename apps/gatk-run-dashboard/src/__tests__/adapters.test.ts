import { describe, it, expect } from 'vitest'
import { normalizeCromwell } from '../adapters/cromwell'
import { parseNextflowTrace } from '../adapters/nextflow'
import { parseSnakemakeMetadata } from '../adapters/snakemake'

// 这些测试聚焦于 "输入 → 标准化 Run/Step/Edge" 的核心行为，
// 不依赖实际后端，只验证适配逻辑是否稳定可预期。

describe('Cromwell adapter - normalizeCromwell', () => {
  it('normalizes basic calls and infers germline edges', () => {
    const meta = {
      id: 'wf-1',
      workflowName: 'GermlineDemo',
      status: 'Succeeded',
      submitted: '2024-01-01T00:00:00Z',
      calls: {
        'demo.bwa_mem': [
          {
            shardIndex: 0,
            attempt: 1,
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-01T00:10:00Z',
            executionStatus: 'Succeeded',
          },
        ],
        'demo.MarkDuplicates': [
          {
            shardIndex: 0,
            attempt: 1,
            start: '2024-01-01T00:10:00Z',
            end: '2024-01-01T00:20:00Z',
            executionStatus: 'Succeeded',
          },
        ],
      },
    }

    const run = normalizeCromwell(meta as any)

    expect(run.id).toBe('wf-1')
    expect(run.name).toBe('GermlineDemo')
    expect(run.pipeline).toBe('Germline')
    expect(run.status).toBe('Succeeded')
    expect(run.steps).toHaveLength(2)

    const bwa = run.steps.find((s) => s.label.toLowerCase().includes('bwa'))
    const markdup = run.steps.find((s) => /markdup|markduplicates/i.test(s.label))

    expect(bwa?.status).toBe('Succeeded')
    expect(markdup?.status).toBe('Succeeded')

    // 应该根据正则推断出从 BWA → MarkDuplicates 的边
    const edge = run.edges.find((e) => e.from === bwa?.id && e.to === markdup?.id)
    expect(edge).toBeTruthy()
  })

  it('marks cached calls as succeeded even when meta status is Failed', () => {
    const meta = {
      id: 'wf-2',
      workflowName: 'CachedDemo',
      status: 'Failed',
      calls: {
        'demo.bwa_mem': [
          {
            callCaching: { hit: true },
            shardIndex: 0,
            attempt: 1,
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-01T00:01:00Z',
          },
        ],
      },
    }

    const run = normalizeCromwell(meta as any)
    expect(run.steps).toHaveLength(1)
    expect(run.steps[0].status).toBe('Succeeded')
  })
})

describe('Nextflow adapter - parseNextflowTrace', () => {
  it('parses a simple trace.tsv and derives run status', () => {
    const trace = [
      'task_id\tprocess\tstatus\tstart\tcomplete\tattempt',
      '1\tbwa\tCOMPLETED\t2024-01-01T00:00:00Z\t2024-01-01T00:10:00Z\t1',
      '2\thaplotypecaller\tFAILED\t2024-01-01T00:10:00Z\t2024-01-01T00:20:00Z\t1',
    ].join('\n')

    const run = parseNextflowTrace(trace)

    expect(run.steps).toHaveLength(2)
    const bwa = run.steps.find((s) => s.label === 'bwa')
    const hc = run.steps.find((s) => s.label === 'haplotypecaller')

    expect(bwa?.status).toBe('Succeeded')
    expect(hc?.status).toBe('Failed')

    // 有失败步骤时，整体 Run 状态应为 Failed
    expect(run.status).toBe('Failed')
  })
})

describe('Snakemake adapter - parseSnakemakeMetadata', () => {
  it('parses jobs with dependencies into steps and edges', () => {
    const meta = {
      workflow: 'snakemake-demo',
      jobs: [
        {
          id: '1',
          rule: 'bwa',
          status: 'running',
        },
        {
          id: '2',
          rule: 'markduplicates',
          status: 'done',
          depends_on: ['1'],
        },
      ],
    }

    const run = parseSnakemakeMetadata(meta)

    expect(run.name).toBe('snakemake-demo')
    expect(run.steps).toHaveLength(2)

    const step1 = run.steps.find((s) => s.id === '1')
    const step2 = run.steps.find((s) => s.id === '2')
    expect(step1?.status).toBe('Running')
    expect(step2?.status).toBe('Succeeded')

    // 依赖关系应该被映射成 Edge
    expect(run.edges).toContainEqual({ from: '1', to: '2' })

    // 有 Running 步骤，应整体视为 Running
    expect(run.status).toBe('Running')
  })

  it('marks run as Succeeded when all steps succeeded', () => {
    const meta = {
      workflow: 'snakemake-all-succeeded',
      jobs: [
        { id: '1', rule: 'bwa', status: 'done' },
        { id: '2', rule: 'markduplicates', status: 'success', depends_on: ['1'] },
      ],
    }

    const run = parseSnakemakeMetadata(meta)
    expect(run.status).toBe('Succeeded')
  })

  it('handles empty jobs array', () => {
    const meta = {
      workflow: 'empty-workflow',
      jobs: [],
    }

    const run = parseSnakemakeMetadata(meta)
    expect(run.steps).toHaveLength(0)
    expect(run.edges).toHaveLength(0)
    expect(run.status).toBe('Queued')
  })

  it('handles rules array fallback', () => {
    const meta = {
      workflow: 'rules-only',
      rules: [{ name: 'bwa' }, { name: 'markduplicates' }],
    }

    const run = parseSnakemakeMetadata(meta)
    expect(run.steps).toHaveLength(2)
    expect(run.steps[0].label).toBe('bwa')
    expect(run.steps[1].label).toBe('markduplicates')
  })
})

describe('Cromwell adapter - edge cases', () => {
  it('handles empty calls object', () => {
    const meta = {
      id: 'wf-empty',
      workflowName: 'EmptyWorkflow',
      status: 'Queued',
      calls: {},
    }

    const run = normalizeCromwell(meta as any)
    expect(run.steps).toHaveLength(0)
    expect(run.edges).toHaveLength(0)
  })

  it('handles missing calls property', () => {
    const meta = {
      id: 'wf-no-calls',
      workflowName: 'NoCallsWorkflow',
      status: 'Queued',
    }

    const run = normalizeCromwell(meta as any)
    expect(run.steps).toHaveLength(0)
  })

  it('correctly maps various status values', () => {
    const meta = {
      id: 'wf-statuses',
      workflowName: 'StatusTest',
      status: 'Running',
      calls: {
        'test.submitted': [{ executionStatus: 'Submitted' }],
        'test.queued': [{ executionStatus: 'QueuedInCromwell' }],
        'test.running': [{ executionStatus: 'Running' }],
        'test.succeeded': [{ executionStatus: 'Succeeded' }],
        'test.failed': [{ executionStatus: 'Failed' }],
        'test.aborted': [{ executionStatus: 'Aborted' }],
      },
    }

    const run = normalizeCromwell(meta as any)
    const findStep = (name: string) => run.steps.find((s) => s.fqname === name)

    expect(findStep('test.submitted')?.status).toBe('Running')
    expect(findStep('test.queued')?.status).toBe('Running')
    expect(findStep('test.running')?.status).toBe('Running')
    expect(findStep('test.succeeded')?.status).toBe('Succeeded')
    expect(findStep('test.failed')?.status).toBe('Failed')
    expect(findStep('test.aborted')?.status).toBe('Aborted')
  })
})

describe('Nextflow adapter - edge cases', () => {
  it('handles empty trace', () => {
    const run = parseNextflowTrace('')
    expect(run.steps).toHaveLength(0)
    expect(run.status).toBe('Queued')
  })

  it('handles header-only trace', () => {
    const trace = 'task_id\tprocess\tstatus\tstart\tcomplete\tattempt'
    const run = parseNextflowTrace(trace)
    expect(run.steps).toHaveLength(0)
  })

  it('correctly determines run status from steps', () => {
    // All pending (mapped to Running in nextflow adapter)
    const allPending = parseNextflowTrace(
      'task_id\tprocess\tstatus\n1\tbwa\tpending\n2\thc\tpending'
    )
    expect(allPending.status).toBe('Running') // pending maps to Running

    // Some running
    const someRunning = parseNextflowTrace(
      'task_id\tprocess\tstatus\n1\tbwa\tcompleted\n2\thc\trunning'
    )
    expect(someRunning.status).toBe('Running')

    // All succeeded
    const allSucceeded = parseNextflowTrace(
      'task_id\tprocess\tstatus\n1\tbwa\tcompleted\n2\thc\tcompleted'
    )
    expect(allSucceeded.status).toBe('Succeeded')
  })
})
