/**
 * Match formats and scoreline logic. The winner is derived from the set scores
 * (no need to pick it by hand). Elo still treats the result as pure win/loss;
 * the detailed score is kept for display and history.
 */

export type MatchFormat = 'set1' | 'best3' | 'best5' | 'supertb'

export interface MatchFormatDef {
  value: MatchFormat
  label: string
  /** Max sets that can be played. */
  maxSets: number
  /** Sets needed to win the match. */
  setsToWin: number
  /** A single tie-break scored in points (e.g. 10-7), not games. */
  tiebreak?: boolean
}

export const MATCH_FORMATS: MatchFormatDef[] = [
  { value: 'set1', label: '1 set', maxSets: 1, setsToWin: 1 },
  { value: 'best3', label: 'Melhor de 3 sets', maxSets: 3, setsToWin: 2 },
  { value: 'best5', label: 'Melhor de 5 sets', maxSets: 5, setsToWin: 3 },
  { value: 'supertb', label: 'Super tie-break', maxSets: 1, setsToWin: 1, tiebreak: true },
]

export const DEFAULT_MATCH_FORMAT: MatchFormat = 'best3'

export function matchFormat(value: string | undefined): MatchFormatDef {
  return MATCH_FORMATS.find(f => f.value === value) ?? MATCH_FORMATS[1]
}

export interface SetScore {
  a: number
  b: number
}

const played = (s: SetScore) => s.a !== 0 || s.b !== 0

/** Winner from the set scores: 'a' | 'b' | null when still undecided or tied. */
export function computeWinner(sets: SetScore[], def: MatchFormatDef): 'a' | 'b' | null {
  let a = 0
  let b = 0
  for (const s of sets) {
    if (!played(s)) continue
    if (s.a > s.b) a++
    else if (s.b > s.a) b++
  }
  if (a >= def.setsToWin && a > b) return 'a'
  if (b >= def.setsToWin && b > a) return 'b'
  return null
}

/** Winner-first scoreline, e.g. "6-4 3-6 6-2". */
export function formatScore(sets: SetScore[], winner: 'a' | 'b'): string {
  return sets
    .filter(played)
    .map(s => (winner === 'a' ? `${s.a}-${s.b}` : `${s.b}-${s.a}`))
    .join(' ')
}
