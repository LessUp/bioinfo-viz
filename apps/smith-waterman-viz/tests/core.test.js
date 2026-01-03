import { describe, it, expect } from 'vitest'
import { buildDP, traceback, sanitizeSeq } from '../core.js'

describe('sanitizeSeq', () => {
  it('converts to uppercase', () => {
    expect(sanitizeSeq('gattaca')).toBe('GATTACA')
  })

  it('removes non-letter characters', () => {
    expect(sanitizeSeq('GAT-TACA')).toBe('GATTACA')
    expect(sanitizeSeq('GAT123TACA')).toBe('GATTACA')
    expect(sanitizeSeq('GAT TACA')).toBe('GATTACA')
  })

  it('handles null and undefined', () => {
    expect(sanitizeSeq(null)).toBe('')
    expect(sanitizeSeq(undefined)).toBe('')
  })

  it('handles empty string', () => {
    expect(sanitizeSeq('')).toBe('')
  })
})

describe('buildDP', () => {
  it('creates correct matrix dimensions', () => {
    const dp = buildDP('ABC', 'DE', { mode: 'sw' })
    expect(dp.rows).toBe(4) // 3 + 1
    expect(dp.cols).toBe(3) // 2 + 1
    expect(dp.S.length).toBe(12) // 4 * 3
    expect(dp.T.length).toBe(12)
  })

  it('initializes NW first row and column with gap penalties', () => {
    const dp = buildDP('ABC', 'DE', { gap: -2, mode: 'nw' })
    // First column: 0, -2, -4, -6
    expect(dp.S[0]).toBe(0)
    expect(dp.S[3]).toBe(-2)
    expect(dp.S[6]).toBe(-4)
    expect(dp.S[9]).toBe(-6)
    // First row: 0, -2, -4
    expect(dp.S[0]).toBe(0)
    expect(dp.S[1]).toBe(-2)
    expect(dp.S[2]).toBe(-4)
  })

  it('SW mode keeps negative scores as zero', () => {
    const dp = buildDP('A', 'B', { match: 1, mismatch: -5, gap: -5, mode: 'sw' })
    // All scores should be >= 0 in SW mode
    for (const score of dp.S) {
      expect(score).toBeGreaterThanOrEqual(0)
    }
  })

  it('records steps for each cell', () => {
    const dp = buildDP('AB', 'CD', { mode: 'sw' })
    // Should have n*m steps (2*2 = 4)
    expect(dp.steps.length).toBe(4)
    // Each step should have required properties
    for (const step of dp.steps) {
      expect(step).toHaveProperty('i')
      expect(step).toHaveProperty('j')
      expect(step).toHaveProperty('sc')
      expect(step).toHaveProperty('tr')
    }
  })

  it('uses default parameters when not provided', () => {
    const dp = buildDP('A', 'A')
    // Default mode is 'sw', default match is 2
    const tb = traceback(dp, 'sw')
    expect(tb.score).toBe(2) // match score
  })
})

describe('traceback', () => {
  it('SW finds highest scoring local alignment', () => {
    const dp = buildDP('XXXGATTACAXXX', 'GATTACA', { match: 2, mismatch: -1, gap: -1, mode: 'sw' })
    const tb = traceback(dp, 'sw')
    // SW finds the best local alignment, which may not be the full sequence
    expect(tb.score).toBeGreaterThan(0)
    expect(tb.alignA.length).toBe(tb.alignB.length)
    // The alignment should contain matching characters
    expect(tb.alignA.length).toBeGreaterThan(0)
  })

  it('NW aligns entire sequences', () => {
    const dp = buildDP('GATTACA', 'GATTACA', { match: 2, mismatch: -1, gap: -1, mode: 'nw' })
    const tb = traceback(dp, 'nw')
    expect(tb.alignA).toBe('GATTACA')
    expect(tb.alignB).toBe('GATTACA')
    expect(tb.score).toBe(14)
  })

  it('handles gaps in alignment', () => {
    const dp = buildDP('GATTACA', 'GATACA', { match: 2, mismatch: -1, gap: -1, mode: 'nw' })
    const tb = traceback(dp, 'nw')
    // One of the alignments should have a gap
    expect(tb.alignA.includes('-') || tb.alignB.includes('-')).toBe(true)
    expect(tb.alignA.length).toBe(tb.alignB.length)
  })

  it('returns empty alignment for empty sequences', () => {
    const dp = buildDP('', '', { mode: 'nw' })
    const tb = traceback(dp, 'nw')
    expect(tb.alignA).toBe('')
    expect(tb.alignB).toBe('')
    expect(tb.path.length).toBe(0)
  })
})

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
      expect(
        [
          [1, 1],
          [1, 0],
          [0, 1],
        ].some(([x, y]) => x === di && y === dj)
      ).toBe(true)
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
      expect(
        [
          [1, 1],
          [1, 0],
          [0, 1],
        ].some(([x, y]) => x === di && y === dj)
      ).toBe(true)
    }
  })
  it('empty input handled', () => {
    const dp = buildDP('', '', { match: 1, mismatch: -1, gap: -1, mode: 'nw' })
    const tb = traceback(dp, 'nw')
    expect(tb.score).toBeGreaterThanOrEqual(0)
    expect(tb.path.length).toBe(0)
  })
})
