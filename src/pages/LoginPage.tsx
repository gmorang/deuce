import { Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../features/auth/AuthProvider'

export function LoginPage() {
  const { user, loading, signIn } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2">
          <span className="size-6 rounded-full bg-ball" />
        </span>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Deuce</h1>
          <p className="mt-1.5 text-fg-muted">Ranking de tênis do grupo</p>
        </div>
      </div>
      <Button onClick={() => signIn()} className="w-full py-3">
        Entrar com Google
      </Button>
    </main>
  )
}
