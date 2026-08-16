import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { useJoinRanking, useMembers } from '../features/rankings/useMembers'
import { useRanking } from '../features/rankings/useRankings'

const joinSchema = z.object({ displayName: z.string().trim().min(2, 'Nome muito curto') })
type JoinForm = z.infer<typeof joinSchema>

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

export function LeaderboardPage() {
  const { rankingId } = useParams()
  const { user } = useAuth()
  const { data: members, isLoading, isError } = useMembers(rankingId)
  const { data: ranking } = useRanking(rankingId)

  const isMember = !!members?.some(m => m.id === user?.uid)
  const provisionalMatches = ranking?.settings?.provisionalEnabled ? (ranking.settings.provisionalMatches ?? 0) : 0

  return (
    <div className="flex flex-col gap-8">
      <section>
        {members && members.length > 0 && (
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-fg-muted">Classificação</h2>
            <span className="text-sm text-fg-subtle">
              {members.length} {members.length === 1 ? 'jogador' : 'jogadores'}
            </span>
          </div>
        )}

        {isLoading && <SkeletonList />}
        {isError && <EmptyState>Não foi possível carregar a classificação.</EmptyState>}
        {members && members.length === 0 && <EmptyState>Ninguém neste ranking ainda. Entre você primeiro. 🎾</EmptyState>}

        {members && members.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {members.map(m => {
              const isMe = m.id === user?.uid
              return (
                <li key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-accent/5' : ''}`}>
                  <span className={`w-5 text-center text-sm tabular ${m.rank <= 3 ? 'font-semibold text-fg' : 'text-fg-subtle'}`}>{m.rank}</span>
                  <Avatar name={m.displayName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      {m.displayName}
                      {isMe && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">você</span>}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                      {m.wins}V · {m.losses}D
                      {m.matchesPlayed < provisionalMatches && (
                        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle">provisório</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`tabular font-semibold ${m.rank === 1 ? 'text-accent' : ''}`}>{m.rating}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-fg-subtle">pts</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {!isLoading && !isMember && rankingId && <JoinCard rankingId={rankingId} />}
    </div>
  )
}

function JoinCard({ rankingId }: { rankingId: string }) {
  const { user } = useAuth()
  const join = useJoinRanking()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinForm>({
    resolver: zodResolver(joinSchema),
    defaultValues: { displayName: user?.displayName ?? '' },
  })

  const onSubmit = handleSubmit(async ({ displayName }) => {
    if (!user) return
    await join.mutateAsync({ rankingId, uid: user.uid, displayName, photoURL: user.photoURL })
  })

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-medium">Entrar neste ranking</h2>
      <p className="mt-1 text-sm text-fg-muted">Confirme como seu nome deve aparecer.</p>
      <form onSubmit={onSubmit} className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <input {...register('displayName')} placeholder="Seu nome" className={inputClass} autoComplete="off" />
          {errors.displayName && <p className="mt-1.5 text-xs text-red-500">{errors.displayName.message}</p>}
        </div>
        <Button type="submit" disabled={join.isPending}>
          {join.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </section>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">{children}</div>
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {[0, 1, 2, 3].map(i => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <span className="w-5" />
          <span className="size-10 animate-pulse rounded-full bg-surface-2" />
          <span className="h-4 flex-1 animate-pulse rounded bg-surface-2" style={{ maxWidth: 140 }} />
          <span className="h-4 w-8 animate-pulse rounded bg-surface-2" />
        </li>
      ))}
    </ul>
  )
}
