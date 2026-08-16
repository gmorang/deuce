import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, limit, orderBy, query, runTransaction } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { DEFAULT_K, updateRatings } from '../elo/elo'
import type { Member, Ranking } from '../rankings/types'
import type { Match, NewMatchInput } from './types'

const matchesRef = (rankingId: string) => collection(db, 'rankings', rankingId, 'matches')

/** Most recent matches of a ranking, newest first. */
export function useRecentMatches(rankingId: string | undefined, max = 20) {
  return useQuery({
    queryKey: ['matches', rankingId, max],
    enabled: !!rankingId,
    queryFn: async (): Promise<Match[]> => {
      if (!rankingId) return []
      const snap = await getDocs(query(matchesRef(rankingId), orderBy('playedAt', 'desc'), limit(max)))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Match, 'id'>) }))
    },
  })
}

/**
 * Record a match result within a ranking. Runs inside a Firestore transaction so
 * both members' ratings and the match document are written atomically.
 */
export function useRecordMatch(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ winnerId, loserId, score, recordedBy }: NewMatchInput & { recordedBy: string }) => {
      if (winnerId === loserId) throw new Error('Escolha dois jogadores diferentes.')

      await runTransaction(db, async tx => {
        const rankingRef = doc(db, 'rankings', rankingId)
        const winnerRef = doc(db, 'rankings', rankingId, 'members', winnerId)
        const loserRef = doc(db, 'rankings', rankingId, 'members', loserId)
        const [rankingSnap, winnerSnap, loserSnap] = await Promise.all([tx.get(rankingRef), tx.get(winnerRef), tx.get(loserRef)])
        if (!winnerSnap.exists() || !loserSnap.exists()) throw new Error('Jogador não encontrado neste ranking.')

        const kFactor = (rankingSnap.data() as Ranking | undefined)?.settings?.kFactor ?? DEFAULT_K
        const winner = winnerSnap.data() as Member
        const loser = loserSnap.data() as Member
        const change = updateRatings(winner.rating, loser.rating, kFactor)

        const matchRef = doc(matchesRef(rankingId))
        tx.set(matchRef, {
          winnerId,
          loserId,
          score: score ?? null,
          winnerRatingBefore: winner.rating,
          loserRatingBefore: loser.rating,
          winnerRatingAfter: change.winner,
          loserRatingAfter: change.loser,
          ratingDelta: change.delta,
          playedAt: Date.now(),
          recordedBy,
        })
        tx.update(winnerRef, { rating: change.winner, wins: winner.wins + 1, matchesPlayed: winner.matchesPlayed + 1 })
        tx.update(loserRef, { rating: change.loser, losses: loser.losses + 1, matchesPlayed: loser.matchesPlayed + 1 })
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', rankingId] })
      qc.invalidateQueries({ queryKey: ['matches', rankingId] })
    },
  })
}
