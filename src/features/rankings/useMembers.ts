import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { DEFAULT_RATING } from '../elo/elo'
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
 * Join a ranking: the signed-in user creates their own member doc, keyed by uid,
 * with clean starting stats. Rules only allow creating the doc at your own uid.
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
        displayName,
        photoURL: photoURL ?? null,
        rating: startRating,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        joinedAt: Date.now(),
      })
    },
    onSuccess: (_data, { rankingId }) => qc.invalidateQueries({ queryKey: ['members', rankingId] }),
  })
}
