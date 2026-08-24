export type RoundStatus = 'confirming' | 'drawn' | 'closed'

export interface Round {
  id: string
  number: number
  status: RoundStatus
  /** Player left without a match this round (odd count). */
  byeId?: string | null
  byeName?: string | null
  createdAt: number
  createdBy: string
}

export interface Participant {
  /** Document id — equals the player's uid. */
  id: string
  displayName: string
  confirmedAt: number
}

export interface Fixture {
  id: string
  aId: string
  aName: string
  bId: string
  bName: string
  /** pending = no result yet · reported = result awaiting approval · played = approved. */
  status: 'pending' | 'reported' | 'played'
  matchId?: string | null
  /** Recorded result summary, for display once played. */
  winnerId?: string | null
  score?: string | null
}
