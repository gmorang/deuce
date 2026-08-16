import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { DEFAULT_RANKING_COLOR, DEFAULT_RANKING_ICON } from './identity'
import { DEFAULT_RANKING_SETTINGS, type Ranking, type RankingSettings } from './types'

const rankingsRef = collection(db, 'rankings')

/** All rankings, newest first. */
export function useRankings() {
  return useQuery({
    queryKey: ['rankings'],
    queryFn: async (): Promise<Ranking[]> => {
      const snap = await getDocs(query(rankingsRef, orderBy('createdAt', 'desc')))
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Ranking, 'id'>) }))
    },
  })
}

/** A single ranking by id. */
export function useRanking(rankingId: string | undefined) {
  return useQuery({
    queryKey: ['ranking', rankingId],
    enabled: !!rankingId,
    queryFn: async (): Promise<Ranking | null> => {
      if (!rankingId) return null
      const snap = await getDoc(doc(db, 'rankings', rankingId))
      return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Ranking, 'id'>) } : null
    },
  })
}

export interface NewRankingInput {
  name: string
  ownerId: string
  description?: string | null
  icon?: string
  color?: string
}

/** Create a ranking. Identity is set at creation; Elo settings use defaults
 * (tweak later in Settings). Rules only allow admins. */
export function useCreateRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, ownerId, description, icon, color }: NewRankingInput) => {
      const ref = await addDoc(rankingsRef, {
        name,
        description: description ?? null,
        icon: icon ?? DEFAULT_RANKING_ICON,
        color: color ?? DEFAULT_RANKING_COLOR,
        ownerId,
        archived: false,
        settings: DEFAULT_RANKING_SETTINGS,
        createdAt: Date.now(),
      })
      return ref.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rankings'] }),
  })
}

export interface RankingUpdate {
  name?: string
  description?: string | null
  icon?: string
  color?: string
  settings?: RankingSettings
}

/** Update a ranking's basic info, identity or Elo settings. Admin only (rules). */
export function useUpdateRanking(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: RankingUpdate) => updateDoc(doc(db, 'rankings', rankingId), { ...patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rankings'] })
      qc.invalidateQueries({ queryKey: ['ranking', rankingId] })
    },
  })
}

/** Soft-hide a ranking without losing its data. */
export function useSetArchived(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (archived: boolean) => updateDoc(doc(db, 'rankings', rankingId), { archived }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rankings'] })
      qc.invalidateQueries({ queryKey: ['ranking', rankingId] })
    },
  })
}

/**
 * Permanently delete a ranking and its subcollections. Firestore doesn't cascade,
 * so members and matches are removed in batches first, then the ranking doc.
 */
export function useDeleteRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rankingId: string) => {
      for (const sub of ['members', 'matches']) {
        const snap = await getDocs(collection(db, 'rankings', rankingId, sub))
        // Batches cap at 500 ops; chunk to stay safe for large rankings.
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(db)
          for (const d of snap.docs.slice(i, i + 400)) batch.delete(d.ref)
          await batch.commit()
        }
      }
      await deleteDoc(doc(db, 'rankings', rankingId))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rankings'] }),
  })
}
