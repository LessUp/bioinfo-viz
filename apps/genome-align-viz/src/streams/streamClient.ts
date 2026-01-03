import type { StreamEvent } from '../types/events'
import { startMockStream } from '../mock/mockStream'
import type { Region } from '../store/useAppStore'

export type SourceType = 'mock' | 'sse' | 'ws'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'stopped' | 'error'

export interface ConnectOptions {
  sourceType: SourceType
  url?: string
  jobId: string
  region?: Region
  /** Maximum number of reconnection attempts, default 10 */
  maxRetries?: number
  /** Initial reconnection delay in milliseconds, default 1000 */
  initialDelay?: number
  /** Maximum reconnection delay in milliseconds, default 30000 */
  maxDelay?: number
}

export interface StreamController {
  /** Stop the stream and clean up all resources */
  stop: () => void
  /** Get current connection status */
  getStatus: () => ConnectionStatus
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @param initialDelay - Initial delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  return Math.min(maxDelay, initialDelay * Math.pow(2, attempt))
}

export function startStream(
  opts: ConnectOptions,
  onEvent: (e: StreamEvent) => void,
  onStatusChange?: (status: ConnectionStatus) => void
): StreamController {
  const maxRetries = opts.maxRetries ?? 10
  const initialDelay = opts.initialDelay ?? 1000
  const maxDelay = opts.maxDelay ?? 30000

  let status: ConnectionStatus = 'connecting'
  const setStatus = (newStatus: ConnectionStatus) => {
    status = newStatus
    onStatusChange?.(newStatus)
  }

  if (opts.sourceType === 'mock') {
    setStatus('connected')
    const stopMock = startMockStream(opts.jobId, onEvent, opts.region)
    return {
      stop: () => {
        stopMock()
        setStatus('stopped')
      },
      getStatus: () => status,
    }
  }

  if (opts.sourceType === 'sse') {
    if (!opts.url) throw new Error('SSE requires url')

    let stopped = false
    let es: EventSource | null = null
    let attempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (es) {
        try {
          es.close()
        } catch {
          /* ignore close errors */
        }
        es = null
      }
    }

    const connect = () => {
      if (stopped) return

      cleanup()
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')

      es = new EventSource(opts.url!)

      es.onopen = () => {
        attempt = 0
        setStatus('connected')
      }

      es.onmessage = (ev: MessageEvent<string>) => {
        try {
          const obj = JSON.parse(ev.data) as StreamEvent
          onEvent(obj)
        } catch {
          /* ignore parse errors */
        }
      }

      es.onerror = () => {
        if (stopped) return

        cleanup()

        if (attempt >= maxRetries) {
          setStatus('error')
          return
        }

        attempt += 1
        const delay = calculateDelay(attempt - 1, initialDelay, maxDelay)
        setStatus('reconnecting')
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return {
      stop: () => {
        stopped = true
        cleanup()
        setStatus('stopped')
      },
      getStatus: () => status,
    }
  }

  if (opts.sourceType === 'ws') {
    if (!opts.url) throw new Error('WebSocket requires url')

    let stopped = false
    let ws: WebSocket | null = null
    let attempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (ws) {
        try {
          ws.close()
        } catch {
          /* ignore close errors */
        }
        ws = null
      }
    }

    const connect = () => {
      if (stopped) return

      cleanup()
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')

      ws = new WebSocket(opts.url!)

      ws.onopen = () => {
        attempt = 0
        setStatus('connected')
      }

      ws.onmessage = (ev: MessageEvent<string>) => {
        try {
          const obj = JSON.parse(ev.data) as StreamEvent
          onEvent(obj)
        } catch {
          /* ignore parse errors */
        }
      }

      ws.onclose = () => {
        if (stopped) return

        cleanup()

        if (attempt >= maxRetries) {
          setStatus('error')
          return
        }

        attempt += 1
        const delay = calculateDelay(attempt - 1, initialDelay, maxDelay)
        setStatus('reconnecting')
        reconnectTimer = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        /* onclose will handle reconnection */
      }
    }

    connect()

    return {
      stop: () => {
        stopped = true
        cleanup()
        setStatus('stopped')
      },
      getStatus: () => status,
    }
  }

  // Fallback for unknown source type
  setStatus('error')
  return {
    stop: () => {
      setStatus('stopped')
    },
    getStatus: () => status,
  }
}
