import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { RankingBadge } from '../components/RankingBadge'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { useJoinByCode } from '../features/rankings/useMembers'
import { useMyRankings } from '../features/rankings/useRankings'

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm uppercase tracking-widest outline-none transition-colors placeholder:tracking-normal placeholder:normal-case placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

export function RankingsListPage() {
  const navigate = useNavigate()
  const { data: rankings, isLoading, isError } = useMyRankings()
  const { data: isAdmin } = useIsAdmin()

  const visible = rankings?.filter(r => isAdmin || !r.archived)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
            <p className="mt-1 text-sm text-fg-muted">Os rankings que você participa.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate('/novo')} className="shrink-0">
              Novo ranking
            </Button>
          )}
        </div>

        {isLoading && <SkeletonGrid />}
        {isError && <EmptyState>Não foi possível carregar os rankings.</EmptyState>}
        {visible && visible.length === 0 && (
          <EmptyState>
            {isAdmin
              ? 'Nenhum ranking ainda. Crie o primeiro em “Novo ranking”. 🎾'
              : 'Você ainda não participa de nenhum ranking. Entre com um código abaixo.'}
          </EmptyState>
        )}

        {visible && visible.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map(r => (
              <Link
                key={r.id}
                to={`/r/${r.id}`}
                className={`group flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-border-strong ${
                  r.archived ? 'opacity-60' : ''
                }`}
              >
                <RankingBadge icon={r.icon} color={r.color} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {r.name}
                    {r.archived && <Badge tone="neutral">arquivado</Badge>}
                  </p>
                  {r.description && <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{r.description}</p>}
                </div>
                <span className="text-fg-subtle transition-transform group-hover:translate-x-0.5">›</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <JoinByCodeCard />
    </div>
  )
}

function JoinByCodeCard() {
  const navigate = useNavigate()
  const join = useJoinByCode()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const rankingId = await join.mutateAsync(code)
      navigate(`/r/${rankingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <h2 className="font-medium">Entrar com código</h2>
      <p className="mt-1 text-sm text-fg-muted">Recebeu um convite? Digite o código do ranking.</p>
      <form onSubmit={onSubmit} className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: 7KQ3R9" className={inputClass} autoComplete="off" maxLength={12} />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
        <Button type="submit" disabled={join.isPending || !code.trim()}>
          {join.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </section>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-fg-muted">{children}</div>
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1].map(i => (
        <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4">
          <span className="size-11 animate-pulse rounded-lg bg-surface-2" />
          <div className="flex-1 space-y-2 py-1">
            <span className="block h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
