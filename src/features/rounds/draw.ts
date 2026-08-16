/**
 * Weekly round draw: pair confirmed players 1-vs-1, using a "rodízio" strategy
 * that avoids repeating past matchups so that, over time, everyone plays
 * everyone. Odd player counts leave one player with a bye (folga).
 *
 * We minimize the total number of repeated matchups. For friend-group sizes
 * (≤ 16 players after the bye) this is solved optimally by brute force, which
 * avoids the "stranding" bug a naive greedy has — where the two players who've
 * met most get forced together because everyone else was paired off first.
 * Larger groups fall back to a fast greedy match. Pure and deterministic given
 * a seeded `rng`, so it can be unit-tested.
 */

export type PairKey = string

/** Order-independent key for a pair of player ids. */
export function pairKey(a: string, b: string): PairKey {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** How many times each pair has already met. */
export type PairingHistory = Record<PairKey, number>

export interface DrawResult {
  pairs: [string, string][]
  bye: string | null
}

const OPTIMAL_MAX = 16

function shuffle<T>(input: readonly T[], rng: () => number): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function cost(history: PairingHistory, a: string, b: string): number {
  return history[pairKey(a, b)] ?? 0
}

/** Optimal minimum-repeat perfect matching by brute force (small n only). */
function optimalMatch(players: readonly string[], history: PairingHistory): { pairs: [string, string][]; cost: number } {
  if (players.length === 0) return { pairs: [], cost: 0 }
  const [first, ...rest] = players
  let best: { pairs: [string, string][]; cost: number } | null = null
  for (let i = 0; i < rest.length; i++) {
    const partner = rest[i]
    const remaining = rest.filter((_, idx) => idx !== i)
    const sub = optimalMatch(remaining, history)
    const total = cost(history, first, partner) + sub.cost
    if (best === null || total < best.cost) {
      best = { pairs: [[first, partner], ...sub.pairs], cost: total }
    }
  }
  return best ?? { pairs: [], cost: 0 }
}

/** Greedy fallback for large groups: pair each player with the least-played opponent. */
function greedyMatch(players: readonly string[], history: PairingHistory): [string, string][] {
  const remaining = players.slice()
  const pairs: [string, string][] = []
  while (remaining.length > 1) {
    const a = remaining.shift()
    if (a === undefined) break
    let bestIdx = 0
    let bestCount = Number.POSITIVE_INFINITY
    for (let i = 0; i < remaining.length; i++) {
      const c = cost(history, a, remaining[i])
      if (c < bestCount) {
        bestCount = c
        bestIdx = i
      }
    }
    const [b] = remaining.splice(bestIdx, 1)
    pairs.push([a, b])
  }
  return pairs
}

export function drawRound(playerIds: readonly string[], history: PairingHistory = {}, rng: () => number = Math.random): DrawResult {
  const players = shuffle(playerIds, rng)

  let bye: string | null = null
  if (players.length % 2 === 1) {
    bye = players.pop() ?? null
  }

  const pairs = players.length <= OPTIMAL_MAX ? optimalMatch(players, history).pairs : greedyMatch(players, history)

  return { pairs, bye }
}

/** Build a pairing history from past matchups (each entry is a played pair). */
export function buildHistory(pastPairs: Iterable<[string, string]>): PairingHistory {
  const history: PairingHistory = {}
  for (const [a, b] of pastPairs) {
    const key = pairKey(a, b)
    history[key] = (history[key] ?? 0) + 1
  }
  return history
}
