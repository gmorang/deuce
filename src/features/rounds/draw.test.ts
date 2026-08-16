import { describe, expect, it } from 'vitest'
import { buildHistory, drawRound, pairKey } from './draw'

const covered = ({ pairs, bye }: { pairs: [string, string][]; bye: string | null }) => {
  const all = pairs.flat()
  if (bye) all.push(bye)
  return new Set(all)
}

describe('pairKey', () => {
  it('is order-independent', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'))
  })
})

describe('buildHistory', () => {
  it('counts each matchup regardless of order', () => {
    const h = buildHistory([
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'c'],
    ])
    expect(h[pairKey('a', 'b')]).toBe(2)
    expect(h[pairKey('a', 'c')]).toBe(1)
  })
})

describe('drawRound', () => {
  it('pairs everyone once with no bye for an even count', () => {
    const result = drawRound(['a', 'b', 'c', 'd'])
    expect(result.pairs).toHaveLength(2)
    expect(result.bye).toBeNull()
    expect(covered(result)).toEqual(new Set(['a', 'b', 'c', 'd']))
  })

  it('leaves exactly one player on a bye for an odd count', () => {
    const result = drawRound(['a', 'b', 'c', 'd', 'e'])
    expect(result.pairs).toHaveLength(2)
    expect(result.bye).not.toBeNull()
    expect(covered(result)).toEqual(new Set(['a', 'b', 'c', 'd', 'e']))
  })

  it('avoids repeating a heavily-played matchup', () => {
    const history = buildHistory(Array.from({ length: 5 }, () => ['p1', 'p2'] as [string, string]))
    // Whoever of p1/p2 is picked first will prefer a 0-count opponent, so they
    // should not be paired together regardless of the shuffle.
    for (let seed = 0; seed < 20; seed++) {
      const { pairs } = drawRound(['p1', 'p2', 'p3', 'p4'], history)
      const together = pairs.some(([a, b]) => (a === 'p1' && b === 'p2') || (a === 'p2' && b === 'p1'))
      expect(together).toBe(false)
    }
  })

  it('handles a single player as a bye', () => {
    const result = drawRound(['solo'])
    expect(result.pairs).toHaveLength(0)
    expect(result.bye).toBe('solo')
  })
})
