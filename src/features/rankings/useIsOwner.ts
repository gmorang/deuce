import { useAuth } from '../auth/AuthProvider'
import type { Ranking } from './types'

/**
 * True when the signed-in user owns this ranking (its creator). Ownership — not a
 * global admin role — is what grants management: config, rounds, invite regen,
 * archive/delete. See `firestore.rules` (owner check on `ownerId`).
 */
export function useIsOwner(ranking?: Ranking | null): boolean {
  const { user } = useAuth()
  return !!user && !!ranking && ranking.ownerId === user.uid
}
