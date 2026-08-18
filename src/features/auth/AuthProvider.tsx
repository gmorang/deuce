import { type User, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isMobile } from '../../lib/browser'
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
    // Complete any pending redirect sign-in (mobile flow) before subscribing.
    getRedirectResult(auth).catch(() => undefined)
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
      // Popup is smoothest on desktop; mobile browsers handle the full-page
      // redirect far more reliably. Popup failures fall back to redirect too.
      signIn: async () => {
        if (isMobile()) {
          await signInWithRedirect(auth, googleProvider)
          return
        }
        try {
          await signInWithPopup(auth, googleProvider)
        } catch {
          await signInWithRedirect(auth, googleProvider)
        }
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
