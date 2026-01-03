import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateDelay, startStream, type ConnectionStatus } from '../streams/streamClient'

/**
 * Feature: project-quality-improvements, Property 3: Exponential Backoff Reconnection
 * Validates: Requirements 10.3
 */
describe('calculateDelay', () => {
  it('should return initialDelay for attempt 0', () => {
    expect(calculateDelay(0, 1000, 30000)).toBe(1000)
  })

  it('should double delay for each attempt', () => {
    expect(calculateDelay(1, 1000, 30000)).toBe(2000)
    expect(calculateDelay(2, 1000, 30000)).toBe(4000)
    expect(calculateDelay(3, 1000, 30000)).toBe(8000)
  })

  it('should cap at maxDelay', () => {
    expect(calculateDelay(10, 1000, 30000)).toBe(30000)
    expect(calculateDelay(20, 1000, 30000)).toBe(30000)
  })

  it('should handle custom initialDelay', () => {
    expect(calculateDelay(0, 500, 30000)).toBe(500)
    expect(calculateDelay(1, 500, 30000)).toBe(1000)
  })

  it('should handle custom maxDelay', () => {
    expect(calculateDelay(5, 1000, 10000)).toBe(10000)
  })

  /**
   * Property test: For any attempt n, delay(n) >= delay(n-1) (monotonic increase)
   */
  it('should be monotonically increasing until maxDelay', () => {
    const initialDelay = 1000
    const maxDelay = 30000
    let prevDelay = 0

    for (let attempt = 0; attempt < 20; attempt++) {
      const delay = calculateDelay(attempt, initialDelay, maxDelay)
      expect(delay).toBeGreaterThanOrEqual(prevDelay)
      expect(delay).toBeLessThanOrEqual(maxDelay)
      expect(delay).toBeGreaterThanOrEqual(initialDelay)
      prevDelay = delay
    }
  })
})

/**
 * Feature: project-quality-improvements, Property 2: Stream Client Connection Lifecycle
 * Validates: Requirements 10.1, 10.2, 10.5
 */
describe('startStream', () => {
  describe('mock source', () => {
    it('should return a StreamController with stop and getStatus', () => {
      const controller = startStream({ sourceType: 'mock', jobId: 'test-job' }, () => {})

      expect(typeof controller.stop).toBe('function')
      expect(typeof controller.getStatus).toBe('function')

      controller.stop()
    })

    it('should set status to connected for mock source', () => {
      const statuses: ConnectionStatus[] = []
      const controller = startStream(
        { sourceType: 'mock', jobId: 'test-job' },
        () => {},
        (status) => statuses.push(status)
      )

      expect(controller.getStatus()).toBe('connected')
      expect(statuses).toContain('connected')

      controller.stop()
    })

    it('should set status to stopped after stop is called', () => {
      const statuses: ConnectionStatus[] = []
      const controller = startStream(
        { sourceType: 'mock', jobId: 'test-job' },
        () => {},
        (status) => statuses.push(status)
      )

      controller.stop()

      expect(controller.getStatus()).toBe('stopped')
      expect(statuses).toContain('stopped')
    })
  })

  describe('SSE source', () => {
    it('should throw error if url is not provided', () => {
      expect(() => {
        startStream({ sourceType: 'sse', jobId: 'test-job' }, () => {})
      }).toThrow('SSE requires url')
    })
  })

  describe('WebSocket source', () => {
    it('should throw error if url is not provided', () => {
      expect(() => {
        startStream({ sourceType: 'ws', jobId: 'test-job' }, () => {})
      }).toThrow('WebSocket requires url')
    })
  })

  describe('unknown source', () => {
    it('should return error status for unknown source type', () => {
      const controller = startStream({ sourceType: 'unknown' as any, jobId: 'test-job' }, () => {})

      expect(controller.getStatus()).toBe('error')
      controller.stop()
    })
  })
})

/**
 * Property test: For any valid options, stop() should always result in 'stopped' status
 */
describe('StreamController lifecycle property', () => {
  it('stop() should always result in stopped status regardless of initial state', () => {
    const sourceTypes = ['mock'] as const

    for (const sourceType of sourceTypes) {
      const controller = startStream({ sourceType, jobId: 'test-job' }, () => {})

      controller.stop()
      expect(controller.getStatus()).toBe('stopped')
    }
  })
})
