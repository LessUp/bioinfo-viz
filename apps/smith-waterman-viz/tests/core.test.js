import { describe, it, expect } from 'vitest'
import { buildDP, traceback } from '../core.js'

describe('DP core', () => {
  it('SW local alignment basic', () => {
    const dp = buildDP('GATTACA', 'GCATGCU', { match: 2, mismatch: -1, gap: -1, mode: 'sw' })
    const tb = traceback(dp, 'sw')
    expect(tb.score).toBeGreaterThan(0)
    expect(tb.path.length).toBeGreaterThan(0)
    expect(tb.alignA.length).toBe(tb.alignB.length)
  })
  it('NW global alignment exact', () => {
    const dp = buildDP('GATTACA', 'GATTACA', { match: 2, mismatch: -1, gap: -1, mode: 'nw' })
    const tb = traceback(dp, 'nw')
    expect(tb.score).toBeGreaterThan(0)
    expect(tb.alignA).toBe('GATTACA')
    expect(tb.alignB).toBe('GATTACA')
    // 路径一致性：相邻步合法（对角/上/左）
    for (let i = 1; i < tb.path.length; i++) {
      const [pi, pj] = tb.path[i - 1]
      const [ci, cj] = tb.path[i]
      const di = ci - pi
      const dj = cj - pj
      expect([[1, 1], [1, 0], [0, 1]].some(([x, y]) => x === di && y === dj)).toBe(true)
    }
  })
  it('path-consistency on SW', () => {
    const dp = buildDP('GATTACA', 'GCATGCU', { match: 2, mismatch: -1, gap: -1, mode: 'sw' })
    const tb = traceback(dp, 'sw')
    for (let i = 1; i < tb.path.length; i++) {
      const [pi, pj] = tb.path[i - 1]
      const [ci, cj] = tb.path[i]
      const di = ci - pi
      const dj = cj - pj
      expect([[1, 1], [1, 0], [0, 1]].some(([x, y]) => x === di && y === dj)).toBe(true)
    }
  })
  it('empty input handled', () => {
    const dp = buildDP('', '', { match: 1, mismatch: -1, gap: -1, mode: 'nw' })
    const tb = traceback(dp, 'nw')
    expect(tb.score).toBeGreaterThanOrEqual(0)
    expect(tb.path.length).toBe(0)
  })
})