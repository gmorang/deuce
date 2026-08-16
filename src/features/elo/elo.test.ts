import { describe, expect, it } from 'vitest'
import { DEFAULT_K, expectedScore, updateRatings } from './elo'

describe('expectedScore', () => {
  it('gives 0.5 for equal ratings', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5)
  })

  it('favors the higher-rated player', () => {
    expect(expectedScore(1600, 1200)).toBeGreaterThan(0.9)
    expect(expectedScore(1200, 1600)).toBeLessThan(0.1)
  })

  it('is symmetric: the two expectations sum to 1', () => {
    expect(expectedScore(1450, 1300) + expectedScore(1300, 1450)).toBeCloseTo(1)
  })
})

describe('updateRatings', () => {
  it('splits the swing evenly for equal opponents (K/2)', () => {
    const { winner, loser, delta } = updateRatings(1200, 1200)
    expect(delta).toBe(DEFAULT_K / 2)
    expect(winner).toBe(1216)
    expect(loser).toBe(1184)
  })

  it("keeps the system zero-sum: winner's gain equals loser's loss", () => {
    const { winner, loser } = updateRatings(1530, 1275)
    expect(winner - 1530).toBe(1275 - loser)
  })

  it('rewards an upset more than an expected win', () => {
    const upset = updateRatings(1200, 1600).delta // underdog wins
    const expected = updateRatings(1600, 1200).delta // favorite wins
    expect(upset).toBeGreaterThan(expected)
  })

  it('respects a custom K-factor', () => {
    expect(updateRatings(1200, 1200, 16).delta).toBe(8)
  })
})
