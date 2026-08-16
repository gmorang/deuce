import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, googleProvider } from '../../lib/firebase'
import { ensureUserProfile } from '../users/useUsers'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, next => {
      setUser(next)
      setLoading(false)
      // Keep the canonical Firestore profile in sync; don't block auth on it.
      if (next) ensureUserProfile(next).catch(() => undefined)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async () => {
        await signInWithPopup(auth, googleProvider)
      },
      logout: () => signOut(auth),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
