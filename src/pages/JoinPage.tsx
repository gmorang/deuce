import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'
import { useAuth } from '../features/auth/AuthProvider'
import { useJoinByCode } from '../features/rankings/useMembers'
import { isEmbeddedBrowser } from '../lib/browser'

/**
 * Invite-link landing: `/entrar/{code}`. If signed in, joins the ranking and
 * redirects into it; if not, offers Google sign-in and joins right after.
 */
export function JoinPage() {
  const { code } = useParams()
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const join = useJoinByCode()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)
  const embedded = isEmbeddedBrowser()

  useEffect(() => {
    if (!user || !code || attempted.current) return
    attempted.current = true
    join
      .mutateAsync(code)
      .then(rankingId => navigate(`/r/${rankingId}`, { replace: true }))
      .catch(e => setError(e instanceof Error ? e.message : 'Não foi possível entrar no ranking.'))
  }, [user, code, join, navigate])

  if (loading) return null

  return (
    <main className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute -top-10 size-80 rounded-full bg-accent/20 blur-[100px]" aria-hidden="true" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-border-strong bg-surface shadow-[var(--shadow)]">
          <Logo size={36} />
        </span>

        {user ? (
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{error ? 'Não deu certo' : 'Entrando no ranking…'}</h1>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Você foi convidado</h1>
              <p className="mt-1.5 text-fg-muted">Entre para participar deste ranking no Deuce.</p>
            </div>
            {embedded ? (
              <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-fg-muted shadow-[var(--shadow)]">
                Abra este link no navegador (Safari/Chrome) para entrar com o Google.
              </p>
            ) : (
              <Button onClick={() => signIn()} className="w-full py-3">
                Entrar com Google
              </Button>
            )}
          </>
        )}
      </div>
    </main>
  )
}
