import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { CreateRankingPage } from './pages/CreateRankingPage'
import { LandingPage } from './pages/LandingPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LoginPage } from './pages/LoginPage'
import { RankingLayout } from './pages/RankingLayout'
import { RankingSettingsPage } from './pages/RankingSettingsPage'
import { RankingsListPage } from './pages/RankingsListPage'
import { RecordMatchPage } from './pages/RecordMatchPage'
import { RoundPage } from './pages/RoundPage'

const queryClient = new QueryClient()

/** Public root: the marketing landing when logged out, the app when logged in. */
function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/rankings" replace />
  return <LandingPage />
}

/** Sends unauthenticated users to the public home (landing), not a bare login. */
function ProtectedGate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-full items-center justify-center text-fg-subtle">Carregando…</div>
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedGate />}>
              <Route element={<AppLayout />}>
                <Route path="/rankings" element={<RankingsListPage />} />
                <Route path="/novo" element={<CreateRankingPage />} />
                <Route path="/r/:rankingId/config" element={<RankingSettingsPage />} />
                <Route path="/r/:rankingId" element={<RankingLayout />}>
                  <Route index element={<LeaderboardPage />} />
                  <Route path="rodada" element={<RoundPage />} />
                  <Route path="registrar" element={<RecordMatchPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
