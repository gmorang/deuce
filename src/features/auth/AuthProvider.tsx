import { type User, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isMobile } from '../../lib/browser'
import { auth, googleProvider } from '../../lib/firebase'
import { ensureUserProfile } from '../users/useUsers'

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Human-readable sign-in error, or null. */
  error: string | null
  signIn: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Friendly message for a Firebase auth error; empty string = benign, don't show. */
function describeAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return ''
  if (code === 'auth/popup-blocked') return 'O navegador bloqueou o pop-up. Permita pop-ups para este site e tente de novo.'
  if (code === 'auth/network-request-failed') return 'Falha de rede. Verifique a conexão e tente de novo.'
  return `Não foi possível entrar${code ? ` (${code})` : ''}. Tente novamente.`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Complete a pending redirect sign-in (mobile flow); surface real failures.
    getRedirectResult(auth).catch(e => {
      const msg = describeAuthError(e)
      if (msg) setError(msg)
    })
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
      error,
      // Chrome/Safari on iOS handle the full-page redirect more reliably than
      // popups; desktop gets the smoother popup. The redirect completes back in
      // getRedirectResult above.
      signIn: async () => {
        setError(null)
        try {
          if (isMobile()) await signInWithRedirect(auth, googleProvider)
          else await signInWithPopup(auth, googleProvider)
        } catch (e) {
          const msg = describeAuthError(e)
          if (msg) setError(msg)
        }
      },
      logout: () => signOut(auth),
    }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
