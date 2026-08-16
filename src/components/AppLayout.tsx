import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { Button } from './Button'

/** App chrome for authenticated routes: sticky header, then the routed page. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const { data: isAdmin } = useIsAdmin()

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="size-2.5 rounded-full bg-ball" />
            Deuce
            {isAdmin && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">admin</span>}
          </Link>
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="size-8 rounded-full bg-surface-2" />
            )}
            <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
