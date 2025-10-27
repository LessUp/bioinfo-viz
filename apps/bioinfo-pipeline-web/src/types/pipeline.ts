export type RunStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';

export interface Sample {
  id: string;
  name: string;
  group?: string;
  meta?: Record<string, any>;
}

export interface Metric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  tags?: string[];
}

export interface Artifact {
  id: string;
  name: string;
  type: 'report' | 'bam' | 'vcf' | 'bed' | 'matrix' | 'json' | 'image';
  sizeBytes?: number;
  url?: string;
}

export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  step?: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  status: RunStatus;
  startedAt?: string;
  finishedAt?: string;
  durationSec?: number;
  metrics: Metric[];
  artifacts: Artifact[];
  logs: LogEntry[];
}

export interface Pipeline {
  id: string;
  project: string;
  samples: Sample[];
  status: RunStatus;
  stages: Stage[];
}
