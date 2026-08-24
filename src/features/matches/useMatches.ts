import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Transaction, addDoc, collection, doc, getDocs, limit, orderBy, query, runTransaction, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { DEFAULT_K, updateRatings } from '../elo/elo'
import type { Member, Ranking } from '../rankings/types'
import { type Match, type NewMatchInput, isApproved } from './types'

export const matchesRef = (rankingId: string) => collection(db, 'rankings', rankingId, 'matches')
const matchRef = (rankingId: string, matchId: string) => doc(db, 'rankings', rankingId, 'matches', matchId)

/** Who must approve a match: the participant who did not record it. */
export function approverFor({ winnerId, loserId, recordedBy }: { winnerId: string; loserId: string; recordedBy: string }): string {
  return recordedBy === winnerId ? loserId : winnerId
}

/**
 * The Firestore shape of a freshly recorded, not-yet-approved match. Rating
 * fields are null (computed at approval); shared by free-form and fixture recording.
 */
export function buildPendingMatch({
  winnerId,
  loserId,
  score,
  format,
  courtName,
  notes,
  playedAt,
  recordedBy,
  roundId,
  fixtureId,
}: NewMatchInput & { recordedBy: string }) {
  if (winnerId === loserId) throw new Error('Escolha dois jogadores diferentes.')
  return {
    winnerId,
    loserId,
    score: score ?? null,
    format: format ?? null,
    courtName: courtName ?? null,
    notes: notes ?? null,
    winnerRatingBefore: null,
    loserRatingBefore: null,
    winnerRatingAfter: null,
    loserRatingAfter: null,
    ratingDelta: null,
    playedAt: playedAt ?? Date.now(),
    recordedBy,
    status: 'pending' as const,
    approverId: approverFor({ winnerId, loserId, recordedBy }),
    createdAt: Date.now(),
    resolvedAt: null,
    resolvedBy: null,
    roundId: roundId ?? null,
    fixtureId: fixtureId ?? null,
  }
}

/** Most recent approved matches of a ranking, newest first. */
export function useRecentMatches(rankingId: string | undefined, max = 20) {
  return useQuery({
    queryKey: ['matches', rankingId, max],
    enabled: !!rankingId,
    queryFn: async (): Promise<Match[]> => {
      if (!rankingId) return []
      const snap = await getDocs(query(matchesRef(rankingId), orderBy('playedAt', 'desc'), limit(max)))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Match, 'id'>) })).filter(isApproved)
    },
  })
}

/**
 * Every approved match a player took part in, oldest first. Two equality queries
 * (as winner / as loser) merged — Firestore has no OR — sorted client-side.
 */
export function usePlayerMatches(rankingId: string | undefined, playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-matches', rankingId, playerId],
    enabled: !!rankingId && !!playerId,
    queryFn: async (): Promise<Match[]> => {
      if (!rankingId || !playerId) return []
      const ref = matchesRef(rankingId)
      const [won, lost] = await Promise.all([getDocs(query(ref, where('winnerId', '==', playerId))), getDocs(query(ref, where('loserId', '==', playerId)))])
      return [...won.docs, ...lost.docs]
        .map(d => ({ id: d.id, ...(d.data() as Omit<Match, 'id'>) }))
        .filter(isApproved)
        .sort((a, b) => a.playedAt - b.playedAt)
    },
  })
}

/** Matches still awaiting approval in a ranking (newest first). */
export function usePendingMatches(rankingId: string | undefined) {
  return useQuery({
    queryKey: ['pending-matches', rankingId],
    enabled: !!rankingId,
    queryFn: async (): Promise<Match[]> => {
      if (!rankingId) return []
      const snap = await getDocs(query(matchesRef(rankingId), where('status', '==', 'pending')))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Match, 'id'>) })).sort((a, b) => (b.createdAt ?? b.playedAt) - (a.createdAt ?? a.playedAt))
    },
  })
}

/**
 * Create a pending match. No rating changes and no member writes happen here —
 * the Elo is applied only when the opponent approves. Returns the new match id.
 */
async function createPendingMatch(rankingId: string, input: NewMatchInput & { recordedBy: string }): Promise<string> {
  const ref = await addDoc(matchesRef(rankingId), buildPendingMatch(input))
  return ref.id
}

/**
 * Approve a pending match inside a transaction: reads the two members (and the
 * ranking's K-factor) off their CURRENT ratings, applies the Elo, marks the
 * match approved, and — if it came from a round fixture — closes the fixture.
 * All reads happen before any writes.
 */
export async function approveMatchInTransaction(tx: Transaction, rankingId: string, matchId: string, approvedBy: string): Promise<void> {
  const mRef = matchRef(rankingId, matchId)
  const rankingRef = doc(db, 'rankings', rankingId)
  const mSnap = await tx.get(mRef)
  if (!mSnap.exists()) throw new Error('Partida não encontrada.')
  const match = mSnap.data() as Match
  if (match.status !== 'pending') throw new Error('Esta partida já foi resolvida.')

  const winnerRef = doc(db, 'rankings', rankingId, 'members', match.winnerId)
  const loserRef = doc(db, 'rankings', rankingId, 'members', match.loserId)
  const [rankingSnap, winnerSnap, loserSnap] = await Promise.all([tx.get(rankingRef), tx.get(winnerRef), tx.get(loserRef)])
  if (!winnerSnap.exists() || !loserSnap.exists()) throw new Error('Jogador não encontrado neste ranking.')

  const kFactor = (rankingSnap.data() as Ranking | undefined)?.settings?.kFactor ?? DEFAULT_K
  const winner = winnerSnap.data() as Member
  const loser = loserSnap.data() as Member
  const change = updateRatings(winner.rating, loser.rating, kFactor)

  tx.update(mRef, {
    status: 'approved',
    winnerRatingBefore: winner.rating,
    loserRatingBefore: loser.rating,
    winnerRatingAfter: change.winner,
    loserRatingAfter: change.loser,
    ratingDelta: change.delta,
    resolvedAt: Date.now(),
    resolvedBy: approvedBy,
  })
  tx.update(winnerRef, { rating: change.winner, wins: winner.wins + 1, matchesPlayed: winner.matchesPlayed + 1 })
  tx.update(loserRef, { rating: change.loser, losses: loser.losses + 1, matchesPlayed: loser.matchesPlayed + 1 })

  if (match.roundId && match.fixtureId) {
    const fixtureRef = doc(db, 'rankings', rankingId, 'rounds', match.roundId, 'fixtures', match.fixtureId)
    tx.update(fixtureRef, { status: 'played', winnerId: match.winnerId, score: match.score ?? null })
  }
}

/** Record a free-form (avulso) match — created pending, awaiting the opponent. */
export function useRecordMatch(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewMatchInput & { recordedBy: string }) => createPendingMatch(rankingId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-matches', rankingId] }),
  })
}

/** Approve a pending match, applying its Elo. */
export function useApproveMatch(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ matchId, approvedBy }: { matchId: string; approvedBy: string }) =>
      runTransaction(db, tx => approveMatchInTransaction(tx, rankingId, matchId, approvedBy)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', rankingId] })
      qc.invalidateQueries({ queryKey: ['matches', rankingId] })
      qc.invalidateQueries({ queryKey: ['pending-matches', rankingId] })
      qc.invalidateQueries({ queryKey: ['player-matches', rankingId] })
      qc.invalidateQueries({ queryKey: ['fixtures', rankingId] })
    },
  })
}

/** Reject a pending match: voids it (no Elo) and reopens its fixture, if any. */
export function useRejectMatch(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ match, rejectedBy }: { match: Match; rejectedBy: string }) =>
      runTransaction(db, async tx => {
        const mRef = matchRef(rankingId, match.id)
        const mSnap = await tx.get(mRef)
        if (!mSnap.exists() || (mSnap.data() as Match).status !== 'pending') throw new Error('Esta partida já foi resolvida.')
        tx.update(mRef, { status: 'rejected', resolvedAt: Date.now(), resolvedBy: rejectedBy })
        if (match.roundId && match.fixtureId) {
          const fixtureRef = doc(db, 'rankings', rankingId, 'rounds', match.roundId, 'fixtures', match.fixtureId)
          tx.update(fixtureRef, { status: 'pending', matchId: null })
        }
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-matches', rankingId] })
      qc.invalidateQueries({ queryKey: ['fixtures', rankingId] })
    },
  })
}
