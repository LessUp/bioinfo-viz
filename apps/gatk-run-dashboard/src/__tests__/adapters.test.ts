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

    const bwa = run.steps.find(s => s.label.toLowerCase().includes('bwa'))
    const markdup = run.steps.find(s => /markdup|markduplicates/i.test(s.label))

    expect(bwa?.status).toBe('Succeeded')
    expect(markdup?.status).toBe('Succeeded')

    // 应该根据正则推断出从 BWA → MarkDuplicates 的边
    const edge = run.edges.find(e => e.from === bwa?.id && e.to === markdup?.id)
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
    const bwa = run.steps.find(s => s.label === 'bwa')
    const hc = run.steps.find(s => s.label === 'haplotypecaller')

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

    const step1 = run.steps.find(s => s.id === '1')
    const step2 = run.steps.find(s => s.id === '2')
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
})
