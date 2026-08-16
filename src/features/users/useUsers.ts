import { useQuery } from '@tanstack/react-query'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { User } from './types'

/**
 * Upsert the canonical user profile on login. `createdAt` and `role` are set
 * once (new users default to 'player'); name, photo and `lastSeenAt` are
 * refreshed on every sign-in. The update path deliberately never touches `role`,
 * so an admin promotion done in the console survives future logins.
 */
export async function ensureUserProfile(u: FirebaseUser) {
  const ref = doc(db, 'users', u.uid)
  const profile = {
    displayName: u.displayName ?? 'Jogador',
    photoURL: u.photoURL ?? null,
    email: u.email ?? null,
    lastSeenAt: Date.now(),
  }
  const snap = await getDoc(ref)
  if (snap.exists()) await updateDoc(ref, profile)
  else await setDoc(ref, { ...profile, role: 'player', createdAt: Date.now() })
}

/** A user's canonical profile by uid. */
export function useUser(uid: string | undefined) {
  return useQuery({
    queryKey: ['user', uid],
    enabled: !!uid,
    queryFn: async (): Promise<User | null> => {
      if (!uid) return null
      const snap = await getDoc(doc(db, 'users', uid))
      return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<User, 'id'>) } : null
    },
  })
}
