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
  winnerRatingBefore: number
  loserRatingBefore: number
  winnerRatingAfter: number
  loserRatingAfter: number
  /** Points the winner gained (and the loser lost) in this match. */
  ratingDelta: number
  playedAt: number
  recordedBy: string
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
}
