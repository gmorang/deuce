import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { DEFAULT_MATCH_FORMAT, type MatchFormat } from '../matches/score'
import { generateInviteCode } from './codes'
import { DEFAULT_RANKING_COLOR, DEFAULT_RANKING_ICON } from './identity'
import { DEFAULT_RANKING_SETTINGS, type Ranking, type RankingSettings, type RankingType } from './types'

const rankingsRef = collection(db, 'rankings')
const inviteRef = (code: string) => doc(db, 'inviteCodes', code)

/**
 * Rankings visible to the current user: the ones they belong to (found via a
 * collection-group query over their `members` docs) plus the ones they own (a
 * creator sees their ranking even before joining it as a player). Rankings are
 * private, so there's no "list everything".
 */
export function useMyRankings() {
  const { user } = useAuth()
  const uid = user?.uid
  return useQuery({
    queryKey: ['my-rankings', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Ranking[]> => {
      if (!uid) return []
      // Memberships via collection-group over `members` (needs the members.uid
      // collection-group index) + rankings I own directly.
      const [memberSnap, ownedSnap] = await Promise.all([
        getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid))),
        getDocs(query(rankingsRef, where('ownerId', '==', uid))),
      ])
      const byId = new Map<string, Ranking>()
      for (const d of ownedSnap.docs) byId.set(d.id, { id: d.id, ...(d.data() as Omit<Ranking, 'id'>) })

      const memberIds = memberSnap.docs.map(d => d.ref.parent.parent?.id).filter((v): v is string => !!v && !byId.has(v))
      const docs = await Promise.all(memberIds.map(id => getDoc(doc(db, 'rankings', id))))
      for (const s of docs) if (s.exists()) byId.set(s.id, { id: s.id, ...(s.data() as Omit<Ranking, 'id'>) })

      return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt)
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
  type?: RankingType
  format?: MatchFormat
}

/** Create a private ranking with an invite code + its public lookup doc. Owner only (rules enforce ownerId). */
export function useCreateRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, ownerId, description, icon, color, type, format }: NewRankingInput) => {
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
        type: type ?? 'singles',
        settings: { ...DEFAULT_RANKING_SETTINGS, defaultFormat: format ?? DEFAULT_MATCH_FORMAT },
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

/** Update a ranking's basic info, identity or Elo settings. Owner only (rules enforce ownerId). */
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

/** Generate a fresh invite code, revoking the old one. Owner only (rules enforce ownerId). */
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
