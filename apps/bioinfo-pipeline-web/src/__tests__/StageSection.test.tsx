import { render, screen } from '@testing-library/react'
import type { Pipeline, Stage } from '@/types/pipeline'
import StageSection from '@/components/stage/StageSection'

function makePipelineAndStage(): { pipeline: Pipeline; stage: Stage } {
  const stage: Stage = {
    id: 'deg',
    name: '差异表达',
    order: 5,
    status: 'running',
    metrics: [{ key: 'deg_found', label: '已发现差异基因', value: 842, unit: '' }],
    artifacts: [{ id: 'matrix', name: 'counts.tsv.gz', type: 'matrix', url: '#' }],
    logs: [],
  }

  const pipeline: Pipeline = {
    id: 'bulk-rna-seq',
    project: 'RNASeq_Tumor_vs_Normal',
    status: 'running',
    samples: [{ id: 'S1', name: 'S1' }],
    stages: [stage],
    profile: {
      name: 'Bulk RNA-Seq 差异表达',
      summary: 'test summary',
      category: 'transcriptomics',
      difficulty: 'intermediate',
      recommendedAudiences: ['test'],
      keyConcepts: ['concept'],
    },
    summary: 'pipeline summary',
    highlights: ['highlight'],
    resources: [],
  }

  return { pipeline, stage }
}

describe('StageSection', () => {
  it('renders metrics and teaching hint when guide exists', () => {
    const { pipeline, stage } = makePipelineAndStage()
    render(<StageSection pipeline={pipeline} stage={stage} />)

    expect(screen.getByText(/差异表达/)).toBeInTheDocument()
    expect(screen.getByText('已发现差异基因')).toBeInTheDocument()
    expect(screen.getByText(/教学提示/)).toBeInTheDocument()
  })

  it('renders artifacts list when present', () => {
    const { pipeline, stage } = makePipelineAndStage()
    render(<StageSection pipeline={pipeline} stage={stage} />)

    expect(screen.getByText('产出物')).toBeInTheDocument()
    expect(screen.getByText('counts.tsv.gz')).toBeInTheDocument()
  })
})
