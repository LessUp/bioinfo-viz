import type { StreamEvent } from '../types/events'
import { startMockStream } from '../mock/mockStream'
import type { Region } from '../store/useAppStore'

export type SourceType = 'mock' | 'sse' | 'ws'

export interface ConnectOptions {
  sourceType: SourceType
  url?: string
  jobId: string
  region?: Region
}

export function startStream(opts: ConnectOptions, onEvent: (e: StreamEvent) => void) {
  let stop = () => {}
  if (opts.sourceType === 'mock') {
    stop = startMockStream(opts.jobId, onEvent, opts.region)
    return () => stop()
  }
  if (opts.sourceType === 'sse') {
    if (!opts.url) throw new Error('SSE 需要提供 url')
    let stopped = false
    let es: EventSource | null = null
    let attempt = 0
    const connect = () => {
      if (stopped) return
      es = new EventSource(opts.url!)
      es.onmessage = (ev: MessageEvent<string>) => {
        try {
          const obj = JSON.parse(ev.data) as StreamEvent
          onEvent(obj)
        } catch {
          /* noop */
        }
      }
      es.onopen = () => {
        attempt = 0
      }
      es.onerror = () => {
        if (stopped) return
        try {
          es?.close()
        } catch {}
        attempt += 1
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt))
        setTimeout(connect, delay)
      }
    }
    connect()
    return () => {
      stopped = true
      try {
        es?.close()
      } catch {}
    }
  }
  if (opts.sourceType === 'ws') {
    if (!opts.url) throw new Error('WebSocket 需要提供 url')
    let stopped = false
    let ws: WebSocket | null = null
    let attempt = 0
    const connect = () => {
      if (stopped) return
      ws = new WebSocket(opts.url!)
      ws.onopen = () => {
        attempt = 0
      }
      ws.onmessage = (ev: MessageEvent<string>) => {
        try {
          const obj = JSON.parse(ev.data) as StreamEvent
          onEvent(obj)
        } catch {
          /* noop */
        }
      }
      ws.onclose = () => {
        if (stopped) return
        attempt += 1
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt))
        setTimeout(connect, delay)
      }
      ws.onerror = () => {
        /* wait for onclose to reconnect */
      }
    }
    connect()
    return () => {
      stopped = true
      try {
        ws?.close()
      } catch {}
    }
  }
  return () => {}
}
