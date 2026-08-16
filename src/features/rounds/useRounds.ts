import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, runTransaction, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { applyMatchInTransaction } from '../matches/useMatches'
import { buildHistory, drawRound } from './draw'
import type { Fixture, Participant, Round } from './types'

const roundsRef = (rankingId: string) => collection(db, 'rankings', rankingId, 'rounds')
const roundRef = (rankingId: string, roundId: string) => doc(db, 'rankings', rankingId, 'rounds', roundId)

/** Rounds of a ranking, newest first. */
export function useRounds(rankingId: string | undefined) {
  return useQuery({
    queryKey: ['rounds', rankingId],
    enabled: !!rankingId,
    queryFn: async (): Promise<Round[]> => {
      if (!rankingId) return []
      const snap = await getDocs(query(roundsRef(rankingId), orderBy('number', 'desc')))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Round, 'id'>) }))
    },
  })
}

/** Confirmed participants of a round. */
export function useParticipants(rankingId: string | undefined, roundId: string | undefined) {
  return useQuery({
    queryKey: ['participants', rankingId, roundId],
    enabled: !!rankingId && !!roundId,
    queryFn: async (): Promise<Participant[]> => {
      if (!rankingId || !roundId) return []
      const snap = await getDocs(collection(db, 'rankings', rankingId, 'rounds', roundId, 'participants'))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Participant, 'id'>) }))
    },
  })
}

/** Fixtures (matchups) of a round. */
export function useFixtures(rankingId: string | undefined, roundId: string | undefined) {
  return useQuery({
    queryKey: ['fixtures', rankingId, roundId],
    enabled: !!rankingId && !!roundId,
    queryFn: async (): Promise<Fixture[]> => {
      if (!rankingId || !roundId) return []
      const snap = await getDocs(collection(db, 'rankings', rankingId, 'rounds', roundId, 'fixtures'))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Fixture, 'id'>) }))
    },
  })
}

/** Open a new round (admin). Numbered after the latest existing round. */
export function useCreateRound(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ createdBy }: { createdBy: string }) => {
      const latest = await getDocs(query(roundsRef(rankingId), orderBy('number', 'desc'), limit(1)))
      const number = latest.empty ? 1 : (latest.docs[0].data() as Round).number + 1
      const ref = doc(roundsRef(rankingId))
      await setDoc(ref, { number, status: 'confirming', createdBy, createdAt: Date.now() })
      return ref.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rounds', rankingId] }),
  })
}

/** Confirm or cancel your own participation in a round (while confirming). */
export function useToggleParticipation(rankingId: string, roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ uid, displayName, confirmed }: { uid: string; displayName: string; confirmed: boolean }) => {
      const ref = doc(db, 'rankings', rankingId, 'rounds', roundId, 'participants', uid)
      if (confirmed) await setDoc(ref, { displayName, confirmedAt: Date.now() })
      else await deleteDoc(ref)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', rankingId, roundId] }),
  })
}

/**
 * Draw the round (admin): pair confirmed participants with the rodízio algorithm,
 * avoiding past matchups, and write the fixtures + bye in one batch.
 */
export function useDrawRound(rankingId: string, roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const [partSnap, matchSnap] = await Promise.all([
        getDocs(collection(db, 'rankings', rankingId, 'rounds', roundId, 'participants')),
        getDocs(collection(db, 'rankings', rankingId, 'matches')),
      ])
      const names = new Map(partSnap.docs.map(d => [d.id, (d.data() as Participant).displayName]))
      const ids = [...names.keys()]
      if (ids.length < 2) throw new Error('Confirme pelo menos dois jogadores para sortear.')

      const history = buildHistory(matchSnap.docs.map(d => [d.data().winnerId as string, d.data().loserId as string]))
      const { pairs, bye } = drawRound(ids, history)

      const batch = writeBatch(db)
      const fixturesRef = collection(db, 'rankings', rankingId, 'rounds', roundId, 'fixtures')
      for (const [aId, bId] of pairs) {
        batch.set(doc(fixturesRef), {
          aId,
          aName: names.get(aId) ?? '?',
          bId,
          bName: names.get(bId) ?? '?',
          status: 'pending',
          matchId: null,
        })
      }
      batch.update(roundRef(rankingId, roundId), {
        status: 'drawn',
        byeId: bye,
        byeName: bye ? (names.get(bye) ?? null) : null,
      })
      await batch.commit()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', rankingId] })
      qc.invalidateQueries({ queryKey: ['fixtures', rankingId, roundId] })
    },
  })
}

/** Close a round (admin). */
export function useCloseRound(rankingId: string, roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => updateDoc(roundRef(rankingId, roundId), { status: 'closed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rounds', rankingId] }),
  })
}

/**
 * Record the result of a fixture: applies the Elo match and marks the fixture as
 * played, atomically, so the two never diverge.
 */
export function useRecordFixture(rankingId: string, roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fixtureId,
      winnerId,
      loserId,
      score,
      recordedBy,
    }: { fixtureId: string; winnerId: string; loserId: string; score?: string; recordedBy: string }) => {
      const fixtureRef = doc(db, 'rankings', rankingId, 'rounds', roundId, 'fixtures', fixtureId)
      await runTransaction(db, async tx => {
        const matchId = await applyMatchInTransaction(tx, rankingId, { winnerId, loserId, score, recordedBy })
        tx.update(fixtureRef, { status: 'played', matchId, winnerId, score: score ?? null })
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixtures', rankingId, roundId] })
      qc.invalidateQueries({ queryKey: ['members', rankingId] })
      qc.invalidateQueries({ queryKey: ['matches', rankingId] })
    },
  })
}
