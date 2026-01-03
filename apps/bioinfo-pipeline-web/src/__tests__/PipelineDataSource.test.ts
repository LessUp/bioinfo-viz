import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import type { Pipeline } from '@/types/pipeline'
import {
  RealBackendDataSource,
  MockPipelineDataSource,
  getPipelineDataSource,
} from '@/lib/pipeline-data-source'

const pipelineFixture: Pipeline = {
  id: 'wes-demo',
  project: 'demo',
  samples: [{ id: 'S1', name: 'S1' }],
  status: 'running',
  stages: [],
  profile: {
    name: 'WES 流程',
    summary: 'demo',
    category: 'germline',
    difficulty: 'beginner',
    recommendedAudiences: [],
    keyConcepts: [],
  },
  summary: 'pipeline summary',
  highlights: [],
  resources: [],
}

describe('RealBackendDataSource', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
  })

  it('fetches pipeline data with auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(pipelineFixture),
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const ds = new RealBackendDataSource({
      baseUrl: 'https://api.example.com',
      authToken: 'token123',
    })
    const result = await ds.getPipeline('wes-demo')

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/pipelines/wes-demo', {
      headers: { Accept: 'application/json', Authorization: 'Bearer token123' },
      cache: 'no-store',
    })
    expect(result?.id).toBe('wes-demo')
  })

  it('returns null on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
        statusText: 'Not Found',
      }) as unknown as typeof fetch
    )

    const ds = new RealBackendDataSource({ baseUrl: 'https://api.example.com' })
    await expect(ds.getPipeline('missing')).resolves.toBeNull()
  })

  it('throws on non-404 error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'boom',
        statusText: 'Server Error',
      }) as unknown as typeof fetch
    )

    const ds = new RealBackendDataSource({ baseUrl: 'https://api.example.com' })
    await expect(ds.getPipeline('wes-demo')).rejects.toThrow(/Backend request failed 500/)
  })
})

describe('getPipelineDataSource', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns real backend data source when env provided', () => {
    // In jsdom environment, window is defined, so we need to use NEXT_PUBLIC_ prefix
    process.env = { ...originalEnv, NEXT_PUBLIC_PIPELINE_API_BASE_URL: 'https://api.example.com' }
    const ds = getPipelineDataSource()
    expect(ds).toBeInstanceOf(RealBackendDataSource)
  })

  it('falls back to mock when env missing', () => {
    process.env = { ...originalEnv, NEXT_PUBLIC_PIPELINE_API_BASE_URL: '' }
    const ds = getPipelineDataSource()
    expect(ds).toBeInstanceOf(MockPipelineDataSource)
  })
})
