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
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Rankings</h1>
        {isAdmin && (
          <Button onClick={() => navigate('/novo')} className="px-3 py-1.5 text-sm">
            + Novo
          </Button>
        )}
      </div>

      {isLoading && <SkeletonList />}
      {isError && <EmptyState>Não foi possível carregar os rankings.</EmptyState>}
      {visible && visible.length === 0 && (
        <EmptyState>{isAdmin ? 'Nenhum ranking ainda. Toque em “+ Novo” para criar o primeiro. 🎾' : 'Nenhum ranking disponível ainda.'}</EmptyState>
      )}

      {visible && visible.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {visible.map(r => (
            <li key={r.id}>
              <Link to={`/r/${r.id}`} className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 ${r.archived ? 'opacity-60' : ''}`}>
                <RankingBadge icon={r.icon} color={r.color} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {r.name}
                    {r.archived && <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">arquivado</span>}
                  </p>
                  {r.description && <p className="truncate text-xs text-fg-muted">{r.description}</p>}
                </div>
                <span className="text-fg-subtle">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">{children}</div>
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {[0, 1, 2].map(i => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <span className="size-9 animate-pulse rounded-lg bg-surface-2" />
          <span className="h-4 flex-1 animate-pulse rounded bg-surface-2" style={{ maxWidth: 160 }} />
        </li>
      ))}
    </ul>
  )
}
