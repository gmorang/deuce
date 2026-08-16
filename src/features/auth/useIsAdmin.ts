import { useUser } from '../users/useUsers'
import { useAuth } from './AuthProvider'

/**
 * True when the signed-in user's profile has role 'admin'. The role lives on
 * `users/{uid}` but is not self-writable — see firestore.rules. Bootstrap the
 * first admin by setting the field in the Firebase console.
 */
export function useIsAdmin() {
  const { user } = useAuth()
  const { data: profile, ...rest } = useUser(user?.uid)
  return { ...rest, data: profile?.role === 'admin' }
}
