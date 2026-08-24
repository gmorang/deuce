/**
 * A match is created `pending` and touches no rating until the opponent
 * approves; approval computes and applies the Elo change, `rejected` voids it.
 */
export type MatchStatus = 'pending' | 'approved' | 'rejected'

export interface Match {
  id: string
  winnerId: string
  loserId: string
  /** Free-form scoreline for display, e.g. "6-4 3-6 7-5". Optional. */
  score?: string | null
  /** Match format (see matches/score). */
  format?: string | null
  courtName?: string | null
  notes?: string | null
  /**
   * Rating snapshots. Null while `pending` — they're computed at approval time,
   * off the members' ratings as they stand then (not when recorded). Legacy
   * matches with no `status` field are treated as approved and always carry them.
   */
  winnerRatingBefore: number | null
  loserRatingBefore: number | null
  winnerRatingAfter: number | null
  loserRatingAfter: number | null
  /** Points the winner gained (and the loser lost) in this match. */
  ratingDelta: number | null
  playedAt: number
  recordedBy: string
  /** Missing on legacy docs — read those as 'approved'. */
  status?: MatchStatus
  /** Player who must approve: the participant who did not record it. */
  approverId?: string
  createdAt?: number
  /** When the match was approved or rejected, and by whom. */
  resolvedAt?: number | null
  resolvedBy?: string | null
  /** Set when the match originated from a round fixture, so approval can close it. */
  roundId?: string | null
  fixtureId?: string | null
}

/** A match is countable (moved ratings) unless it's pending or rejected. */
export function isApproved(m: Match): boolean {
  return m.status !== 'pending' && m.status !== 'rejected'
}

/** Payload the UI submits to record a new match. */
export interface NewMatchInput {
  winnerId: string
  loserId: string
  score?: string
  format?: string
  courtName?: string
  notes?: string
  /** When the match was played (ms). Defaults to now. */
  playedAt?: number
  /** Set when recording a round fixture, so approval can close the fixture. */
  roundId?: string
  fixtureId?: string
}
