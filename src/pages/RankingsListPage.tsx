import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { RankingBadge } from '../components/RankingBadge'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { useRankings } from '../features/rankings/useRankings'

export function RankingsListPage() {
  const navigate = useNavigate()
  const { data: rankings, isLoading, isError } = useRankings()
  const { data: isAdmin } = useIsAdmin()

  // Archived rankings stay visible to admins (to reopen/manage), hidden to others.
  const visible = rankings?.filter(r => isAdmin || !r.archived)

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
          <p className="mt-1 text-sm text-fg-muted">Escolha um ranking para ver a classificação.</p>
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
        <EmptyState>{isAdmin ? 'Nenhum ranking ainda. Crie o primeiro em “Novo ranking”. 🎾' : 'Nenhum ranking disponível ainda.'}</EmptyState>
      )}

      {visible && visible.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map(r => (
            <Link
              key={r.id}
              to={`/r/${r.id}`}
              className={`group flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow)] transition-all hover:border-border-strong hover:-translate-y-0.5 ${
                r.archived ? 'opacity-60' : ''
              }`}
            >
              <RankingBadge icon={r.icon} color={r.color} size={44} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {r.name}
                  {r.archived && <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">arquivado</span>}
                </p>
                {r.description && <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{r.description}</p>}
              </div>
              <span className="text-fg-subtle transition-transform group-hover:translate-x-0.5">›</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-fg-muted">{children}</div>
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map(i => (
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
