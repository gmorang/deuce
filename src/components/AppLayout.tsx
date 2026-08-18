import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { Badge } from './Badge'
import { Logo } from './Logo'

function Brand() {
  return (
    <Link to="/rankings" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <Logo size={20} />
      Deuce
    </Link>
  )
}

const sideNav = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg'
  }`

/** Responsive chrome: sidebar on desktop, sticky top bar on mobile. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const { data: isAdmin } = useIsAdmin()

  const userFooter = (
    <div className="flex items-center gap-2.5">
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" className="size-8 rounded-full ring-1 ring-border" referrerPolicy="no-referrer" />
      ) : (
        <span className="size-8 rounded-full bg-surface-2" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.displayName ?? 'Jogador'}</p>
        <p className="text-xs text-fg-subtle">{isAdmin ? 'Admin' : 'Jogador'}</p>
      </div>
      <button
        type="button"
        onClick={() => logout()}
        aria-label="Sair"
        className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <LogoutIcon />
      </button>
    </div>
  )

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-3 py-5 md:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          <NavLink to="/rankings" end className={sideNav}>
            <TrophyIcon />
            Rankings
          </NavLink>
          {isAdmin && (
            <NavLink to="/novo" className={sideNav}>
              <PlusIcon />
              Novo ranking
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-border pt-3">{userFooter}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 border-b border-border bg-bg/70 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Brand />
              {isAdmin && (
                <Badge tone="accent" uppercase>
                  admin
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="size-8 rounded-full ring-1 ring-border" referrerPolicy="no-referrer" />
              ) : (
                <span className="size-8 rounded-full bg-surface-2" />
              )}
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Sair"
                className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-10 md:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
