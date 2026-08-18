import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { DEFAULT_RATING } from '../elo/elo'
import { normalizeInviteCode } from './codes'
import type { Member, RankedMember, Ranking } from './types'

const membersRef = (rankingId: string) => collection(db, 'rankings', rankingId, 'members')

/** Members of a ranking, ordered by rating (highest first), tagged with rank. */
export function useMembers(rankingId: string | undefined) {
  return useQuery({
    queryKey: ['members', rankingId],
    enabled: !!rankingId,
    queryFn: async (): Promise<RankedMember[]> => {
      if (!rankingId) return []
      const snap = await getDocs(query(membersRef(rankingId), orderBy('rating', 'desc')))
      return snap.docs.map((d, i) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>), rank: i + 1 }))
    },
  })
}

/**
 * Join a ranking you can already see (used by admins on the ranking page). The
 * `uid` field lets the home find this ranking via a collection-group query.
 */
export function useJoinRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      rankingId,
      uid,
      displayName,
      photoURL,
    }: {
      rankingId: string
      uid: string
      displayName: string
      photoURL?: string | null
    }) => {
      const rankingSnap = await getDoc(doc(db, 'rankings', rankingId))
      const startRating = (rankingSnap.data() as Ranking | undefined)?.settings?.startRating ?? DEFAULT_RATING
      await setDoc(doc(db, 'rankings', rankingId, 'members', uid), {
        uid,
        displayName,
        photoURL: photoURL ?? null,
        rating: startRating,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        joinedAt: Date.now(),
      })
    },
    onSuccess: (_data, { rankingId }) => {
      qc.invalidateQueries({ queryKey: ['members', rankingId] })
      qc.invalidateQueries({ queryKey: ['my-rankings'] })
    },
  })
}

/**
 * Join a private ranking with an invite code. Looks the code up in the public
 * `inviteCodes` collection, then creates the member doc (with `uid`, validated
 * against the code in the security rules). Returns the ranking id.
 */
export function useJoinByCode() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (rawCode: string): Promise<string> => {
      if (!user) throw new Error('Faça login primeiro.')
      const code = normalizeInviteCode(rawCode)
      if (code.length < 4) throw new Error('Código inválido.')

      const inviteSnap = await getDoc(doc(db, 'inviteCodes', code))
      if (!inviteSnap.exists()) throw new Error('Código não encontrado. Confira com quem te convidou.')
      const invite = inviteSnap.data() as { rankingId: string; startRating?: number }
      const rankingId = invite.rankingId

      const memberRef = doc(db, 'rankings', rankingId, 'members', user.uid)
      const existing = await getDoc(memberRef)
      if (existing.exists()) return rankingId

      await setDoc(memberRef, {
        uid: user.uid,
        displayName: user.displayName ?? 'Jogador',
        photoURL: user.photoURL ?? null,
        rating: invite.startRating ?? DEFAULT_RATING,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        joinedAt: Date.now(),
        viaCode: code,
      })
      return rankingId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-rankings'] }),
  })
}
