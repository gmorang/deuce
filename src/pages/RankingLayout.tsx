import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { RankingBadge } from '../components/RankingBadge'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { useRanking } from '../features/rankings/useRankings'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors ${isActive ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`

/** Chrome for a single ranking: back link, title, admin settings, and tabs. */
export function RankingLayout() {
  const { rankingId } = useParams()
  const { data: ranking } = useRanking(rankingId)
  const { data: isAdmin } = useIsAdmin()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <NavLink to="/rankings" className="text-sm text-fg-muted transition-colors hover:text-fg">
          ‹ Rankings
        </NavLink>
        <div className="mt-1 flex items-center gap-3">
          {ranking && <RankingBadge icon={ranking.icon} color={ranking.color} size={40} />}
          <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight">{ranking?.name ?? '…'}</h1>
          {isAdmin && (
            <Link
              to={`/r/${rankingId}/config`}
              aria-label="Configurações do ranking"
              className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              ⚙️
            </Link>
          )}
        </div>
        {ranking?.description && <p className="mt-1 text-sm text-fg-muted">{ranking.description}</p>}
      </div>

      <nav className="flex gap-1 rounded-xl bg-surface-2 p-1">
        <NavLink to={`/r/${rankingId}`} end className={tabClass}>
          Ranking
        </NavLink>
        <NavLink to={`/r/${rankingId}/rodada`} className={tabClass}>
          Rodada
        </NavLink>
        <NavLink to={`/r/${rankingId}/registrar`} className={tabClass}>
          Registrar
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
