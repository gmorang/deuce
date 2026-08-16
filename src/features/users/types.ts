export type UserRole = 'admin' | 'player'

export interface User {
  /** Document id — equals the Firebase Auth uid. */
  id: string
  displayName: string
  photoURL?: string | null
  email?: string | null
  /** 'admin' can create/manage rankings. Only an admin (or the console) can
   * change this — a user cannot promote themselves (enforced in firestore.rules). */
  role: UserRole
  createdAt: number
  lastSeenAt: number
}
