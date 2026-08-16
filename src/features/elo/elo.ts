/**
 * Elo rating system for individual tennis matches.
 *
 * Each player has a numeric rating. After a match, the winner gains points
 * and the loser drops the same amount; the size of the swing depends on how
 * "expected" the result was — beating a much stronger opponent is worth more.
 *
 * MVP uses a pure win/loss outcome. The scoreline is stored on the match for
 * display and can later feed a margin-of-victory multiplier (see `kFactor`).
 */

/** Rating every new player starts with. */
export const DEFAULT_RATING = 1200

/** Base K-factor: the maximum single-match swing before expectation scaling. */
export const DEFAULT_K = 32

/**
 * Expected score (win probability) of A against B, in the range (0, 1).
 * A 400-point gap means the stronger player is expected to win ~10x as often.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400))
}

export interface RatingChange {
  winner: number
  loser: number
  /** Signed points the winner gained (and the loser lost). */
  delta: number
}

/**
 * Compute new ratings after a match. Ratings are rounded to whole numbers so
 * they stay readable; the winner's gain always equals the loser's loss.
 */
export function updateRatings(winnerRating: number, loserRating: number, k: number = DEFAULT_K): RatingChange {
  const expected = expectedScore(winnerRating, loserRating)
  const delta = Math.round(k * (1 - expected))
  return {
    winner: winnerRating + delta,
    loser: loserRating - delta,
    delta,
  }
}
