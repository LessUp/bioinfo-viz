import type { Run } from '../store/runStore'

const now = Date.now()
const t = (min: number) => new Date(now + min * 60 * 1000).toISOString()

export const exampleRun: Run = {
  id: 'run-001',
  name: 'sampleA-germline',
  pipeline: 'Germline',
  createdAt: t(0),
  status: 'Running',
  steps: [
    { id: 'bwa', label: 'BWA-MEM', phase: 'Preprocess', status: 'Succeeded', startTime: t(0), endTime: t(30) },
    { id: 'markdup', label: 'MarkDuplicates', phase: 'Preprocess', status: 'Succeeded', startTime: t(30), endTime: t(45) },
    { id: 'bqsr1', label: 'BaseRecalibrator', phase: 'Preprocess', status: 'Succeeded', startTime: t(45), endTime: t(70) },
    { id: 'bqsr2', label: 'ApplyBQSR', phase: 'Preprocess', status: 'Succeeded', startTime: t(70), endTime: t(85) },
    { id: 'hc', label: 'HaplotypeCaller (GVCF)', phase: 'VariantCalling', status: 'Running', startTime: t(85) },
    { id: 'gdb', label: 'GenomicsDBImport', phase: 'JointGenotyping', status: 'Queued' },
    { id: 'geno', label: 'GenotypeGVCFs', phase: 'JointGenotyping', status: 'Queued' },
    { id: 'filter', label: 'VQSR/HardFilter', phase: 'Filtering', status: 'Queued' }
  ],
  edges: [
    { from: 'bwa', to: 'markdup' },
    { from: 'markdup', to: 'bqsr1' },
    { from: 'bqsr1', to: 'bqsr2' },
    { from: 'bqsr2', to: 'hc' },
    { from: 'hc', to: 'gdb' },
    { from: 'gdb', to: 'geno' },
    { from: 'geno', to: 'filter' }
  ]
}
