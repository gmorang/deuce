import { describe, expect, it } from 'vitest'
import { type SetScore, computeWinner, formatScore, matchFormat } from './score'

const best3 = matchFormat('best3')
const set1 = matchFormat('set1')
const supertb = matchFormat('supertb')

const sets = (pairs: [number, number][]): SetScore[] => pairs.map(([a, b]) => ({ a, b }))

describe('computeWinner', () => {
  it('needs 2 sets to win a best-of-3', () => {
    expect(
      computeWinner(
        sets([
          [6, 4],
          [6, 3],
        ]),
        best3,
      ),
    ).toBe('a')
    expect(
      computeWinner(
        sets([
          [4, 6],
          [3, 6],
        ]),
        best3,
      ),
    ).toBe('b')
  })

  it('handles a three-set match', () => {
    expect(
      computeWinner(
        sets([
          [6, 4],
          [3, 6],
          [7, 5],
        ]),
        best3,
      ),
    ).toBe('a')
  })

  it('is undecided at one set all', () => {
    expect(
      computeWinner(
        sets([
          [6, 4],
          [4, 6],
        ]),
        best3,
      ),
    ).toBeNull()
  })

  it('decides a single set / super tie-break by the one set', () => {
    expect(computeWinner(sets([[6, 3]]), set1)).toBe('a')
    expect(computeWinner(sets([[8, 10]]), supertb)).toBe('b')
  })

  it('ignores empty (0-0) sets', () => {
    expect(
      computeWinner(
        sets([
          [6, 4],
          [6, 2],
          [0, 0],
        ]),
        best3,
      ),
    ).toBe('a')
  })
})

describe('formatScore', () => {
  it('writes the winner’s games first', () => {
    expect(
      formatScore(
        sets([
          [6, 4],
          [3, 6],
          [7, 5],
        ]),
        'a',
      ),
    ).toBe('6-4 3-6 7-5')
    expect(
      formatScore(
        sets([
          [4, 6],
          [6, 3],
          [5, 7],
        ]),
        'b',
      ),
    ).toBe('6-4 3-6 7-5')
  })

  it('drops unplayed sets', () => {
    expect(
      formatScore(
        sets([
          [6, 4],
          [6, 2],
          [0, 0],
        ]),
        'a',
      ),
    ).toBe('6-4 6-2')
  })
})
