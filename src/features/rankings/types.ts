import { DEFAULT_MATCH_FORMAT, type MatchFormat } from '../matches/score'

/** Singles for now; doubles is planned. */
export type RankingType = 'singles' | 'doubles'

export interface RankingSettings {
  /** Rating every new member starts with. */
  startRating: number
  /** Elo K-factor: how reactive ratings are to a single result. */
  kFactor: number
  /** Whether to tag new members as "provisional" until they've played enough. */
  provisionalEnabled: boolean
  /** Matches a member needs before losing the "provisional" tag. */
  provisionalMatches: number
  /** Default match format pre-selected when recording a result. */
  defaultFormat: MatchFormat
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
  /** Short code people type to join this private ranking. */
  inviteCode: string
  /** Singles or doubles ranking. */
  type: RankingType
  settings: RankingSettings
}

export const DEFAULT_RANKING_SETTINGS: RankingSettings = {
  startRating: 1200,
  kFactor: 32,
  provisionalEnabled: true,
  provisionalMatches: 3,
  defaultFormat: DEFAULT_MATCH_FORMAT,
}

export interface Member {
  /** Document id — equals the member's Firebase Auth uid. */
  id: string
  /** Same value as `id`; stored as a field so it can be queried across all
   * rankings (collection-group) to list "my rankings". */
  uid: string
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
