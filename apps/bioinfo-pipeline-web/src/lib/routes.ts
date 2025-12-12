export const ROUTES = {
  docs: {
    ngsAnalysisGuide: '/docs/ngs-analysis-guide' as const,
  },
  slides: {
    ngsVsTgs: '/slides/ngs-vs-tgs' as const,
  },
  apps: {
    picardWorkflowSpa: '/apps/picard-workflow-spa' as const,
    bwaAlgorithmViz: '/apps/bwa-algorithm-viz' as const,
    smithWatermanViz: '/apps/smith-waterman-viz' as const,
    debruijnViz: '/apps/debruijn-viz' as const,
    gatkRunDashboard: '/apps/gatk-run-dashboard' as const,
    genomeAlignViz: '/apps/genome-align-viz' as const,
  },
  pipelines: {
    wesGermline: '/pipelines/wes-germline' as const,
    bulkRnaSeq: '/pipelines/bulk-rna-seq' as const,
    singleCell: '/pipelines/single-cell' as const,
  },
  external: {
    repo: 'https://github.com/your-org/bioinfo-visualizer' as const,
    rnaSeqGuide: 'https://rnaseq101.example.com' as const,
    singleCellHub: 'https://singlecellhub.example.com' as const,
  },
} as const

type ValueOf<T> = T[keyof T]
export type RoutePath =
  | ValueOf<(typeof ROUTES)['docs']>
  | ValueOf<(typeof ROUTES)['slides']>
  | ValueOf<(typeof ROUTES)['apps']>
  | ValueOf<(typeof ROUTES)['pipelines']>
  | ValueOf<(typeof ROUTES)['external']>
