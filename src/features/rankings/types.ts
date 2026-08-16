export interface RankingSettings {
  /** Rating every new member starts with. */
  startRating: number
  /** Elo K-factor: how reactive ratings are to a single result. */
  kFactor: number
  /** Whether to tag new members as "provisional" until they've played enough. */
  provisionalEnabled: boolean
  /** Matches a member needs before losing the "provisional" tag. */
  provisionalMatches: number
}

export interface Ranking {
  id: string
  name: string
  description?: string | null
  /** Emoji used as the ranking's icon. */
  icon: string
  /** Palette key (see rankingColors) for the icon disc. */
  color: string
  /** uid of the admin who created it. */
  ownerId: string
  createdAt: number
  archived: boolean
  settings: RankingSettings
}

export const DEFAULT_RANKING_SETTINGS: RankingSettings = {
  startRating: 1200,
  kFactor: 32,
  provisionalEnabled: true,
  provisionalMatches: 3,
}

export interface Member {
  /** Document id — equals the member's Firebase Auth uid. */
  id: string
  displayName: string
  photoURL?: string | null
  rating: number
  wins: number
  losses: number
  matchesPlayed: number
  joinedAt: number
}

/** A member enriched with their position in the ranking (1-based). */
export interface RankedMember extends Member {
  rank: number
}
