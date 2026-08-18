import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useIsAdmin } from '../auth/useIsAdmin'
import { generateInviteCode } from './codes'
import { DEFAULT_RANKING_COLOR, DEFAULT_RANKING_ICON } from './identity'
import { DEFAULT_RANKING_SETTINGS, type Ranking, type RankingSettings } from './types'

const rankingsRef = collection(db, 'rankings')
const inviteRef = (code: string) => doc(db, 'inviteCodes', code)

/**
 * Rankings visible to the current user: the ones they belong to (found via a
 * collection-group query over their `members` docs), or *all* rankings for an
 * admin. Rankings are private, so there's no "list everything" for players.
 */
export function useMyRankings() {
  const { user } = useAuth()
  const { data: isAdmin } = useIsAdmin()
  const uid = user?.uid
  return useQuery({
    queryKey: ['my-rankings', uid, !!isAdmin],
    enabled: !!uid && isAdmin !== undefined,
    queryFn: async (): Promise<Ranking[]> => {
      if (!uid) return []
      if (isAdmin) {
        const snap = await getDocs(query(rankingsRef, orderBy('createdAt', 'desc')))
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Ranking, 'id'>) }))
      }
      const memberSnap = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)))
      const ids = memberSnap.docs.map(d => d.ref.parent.parent?.id).filter((v): v is string => !!v)
      const docs = await Promise.all(ids.map(id => getDoc(doc(db, 'rankings', id))))
      return docs
        .filter(s => s.exists())
        .map(s => ({ id: s.id, ...(s.data() as Omit<Ranking, 'id'>) }))
        .sort((a, b) => b.createdAt - a.createdAt)
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

/** Create a private ranking with an invite code + its public lookup doc. Admin only. */
export function useCreateRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, ownerId, description, icon, color }: NewRankingInput) => {
      const ref = doc(rankingsRef)
      const code = generateInviteCode()
      const batch = writeBatch(db)
      batch.set(ref, {
        name,
        description: description ?? null,
        icon: icon ?? DEFAULT_RANKING_ICON,
        color: color ?? DEFAULT_RANKING_COLOR,
        ownerId,
        archived: false,
        inviteCode: code,
        settings: DEFAULT_RANKING_SETTINGS,
        createdAt: Date.now(),
      })
      batch.set(inviteRef(code), { rankingId: ref.id, startRating: DEFAULT_RANKING_SETTINGS.startRating, createdAt: Date.now(), createdBy: ownerId })
      await batch.commit()
      return ref.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-rankings'] }),
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
      qc.invalidateQueries({ queryKey: ['my-rankings'] })
      qc.invalidateQueries({ queryKey: ['ranking', rankingId] })
    },
  })
}

/** Generate a fresh invite code, revoking the old one. Admin only. */
export function useRegenerateCode(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ oldCode, startRating, ownerId }: { oldCode?: string; startRating: number; ownerId: string }) => {
      const code = generateInviteCode()
      const batch = writeBatch(db)
      batch.update(doc(db, 'rankings', rankingId), { inviteCode: code })
      batch.set(inviteRef(code), { rankingId, startRating, createdAt: Date.now(), createdBy: ownerId })
      if (oldCode) batch.delete(inviteRef(oldCode))
      await batch.commit()
      return code
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranking', rankingId] }),
  })
}

/** Soft-hide a ranking without losing its data. */
export function useSetArchived(rankingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (archived: boolean) => updateDoc(doc(db, 'rankings', rankingId), { archived }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rankings'] })
      qc.invalidateQueries({ queryKey: ['ranking', rankingId] })
    },
  })
}

/**
 * Permanently delete a ranking, its subcollections, and its invite code doc.
 * Firestore doesn't cascade, so children are removed in batches first.
 */
export function useDeleteRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rankingId: string) => {
      const rankingSnap = await getDoc(doc(db, 'rankings', rankingId))
      const code = (rankingSnap.data() as Ranking | undefined)?.inviteCode
      for (const sub of ['members', 'matches']) {
        const snap = await getDocs(collection(db, 'rankings', rankingId, sub))
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(db)
          for (const d of snap.docs.slice(i, i + 400)) batch.delete(d.ref)
          await batch.commit()
        }
      }
      if (code) await deleteDoc(inviteRef(code))
      await deleteDoc(doc(db, 'rankings', rankingId))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-rankings'] }),
  })
}
