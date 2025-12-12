import type { Pipeline } from '@/types/pipeline'
import { buildPipelineRun, pipelineTemplates } from '@/lib/pipeline-presets'

export interface PipelineDataSource {
  getPipeline(id: string): Promise<Pipeline | null>
}

const DEFAULT_PIPELINE_ID = pipelineTemplates[0]?.id ?? 'wes-germline'

export class MockPipelineDataSource implements PipelineDataSource {
  constructor(private fallbackId: string = DEFAULT_PIPELINE_ID) {}

  async getPipeline(id: string): Promise<Pipeline | null> {
    const resolved = id || this.fallbackId
    return buildPipelineRun(resolved) ?? null
  }
}

export interface RealBackendOptions {
  baseUrl: string
  authToken?: string
}

export class RealBackendDataSource implements PipelineDataSource {
  constructor(private options: RealBackendOptions) {}

  private buildUrl(id: string) {
    const trimmed = this.options.baseUrl.replace(/\/$/, '')
    return `${trimmed}/pipelines/${encodeURIComponent(id)}`
  }

  async getPipeline(id: string): Promise<Pipeline | null> {
    const url = this.buildUrl(id)
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (this.options.authToken) {
      headers.Authorization = `Bearer ${this.options.authToken}`
    }

    const res = await fetch(url, { headers, cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Backend request failed ${res.status}: ${text || res.statusText}`)
    }

    return (await res.json()) as Pipeline
  }
}

export function getPipelineDataSource(): PipelineDataSource {
  const baseUrl = process.env.PIPELINE_API_BASE_URL ?? process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL
  if (baseUrl) {
    return new RealBackendDataSource({ baseUrl, authToken: process.env.PIPELINE_API_TOKEN })
  }

  return new MockPipelineDataSource()
}

export function getDefaultPipelineId() {
  return DEFAULT_PIPELINE_ID
}
