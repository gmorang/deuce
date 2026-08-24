import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { InviteCard } from '../components/InviteCard'
import { MedalRank } from '../components/MedalRank'
import { PendingMatches } from '../components/PendingMatches'
import { RatingBar } from '../components/RatingBar'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import type { RankedMember } from '../features/rankings/types'
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
  const { data: isAdmin } = useIsAdmin()

  const isMember = !!members?.some(m => m.id === user?.uid)
  const provisionalMatches = ranking?.settings?.provisionalEnabled ? (ranking.settings.provisionalMatches ?? 0) : 0

  const ratings = members?.map(m => m.rating) ?? []
  const maxRating = Math.max(...ratings, 1)
  const minRating = Math.min(...ratings, 0)

  return (
    <div className="flex flex-col gap-8">
      {isMember && rankingId && members && <PendingMatches rankingId={rankingId} members={members} />}

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
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]">
            {members.map((m, i) => (
              <Row
                key={m.id}
                rankingId={rankingId}
                member={m}
                isMe={m.id === user?.uid}
                provisionalMatches={provisionalMatches}
                fill={maxRating > minRating ? (m.rating - minRating) / (maxRating - minRating) : 1}
                delay={Math.min(i, 12) * 30}
              />
            ))}
          </ul>
        )}
      </section>

      {isMember && ranking && <InviteCard ranking={ranking} isAdmin={!!isAdmin} />}
      {!isLoading && !isMember && rankingId && <JoinCard rankingId={rankingId} />}
    </div>
  )
}

function Row({
  rankingId,
  member: m,
  isMe,
  provisionalMatches,
  fill,
  delay,
}: { rankingId: string | undefined; member: RankedMember; isMe: boolean; provisionalMatches: number; fill: number; delay: number }) {
  const provisional = m.matchesPlayed < provisionalMatches
  return (
    <li className="rise" style={{ animationDelay: `${delay}ms` }}>
      <Link
        to={`/r/${rankingId}/j/${m.id}`}
        className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50 ${isMe ? 'bg-accent/[0.06]' : ''}`}
      >
        <MedalRank rank={m.rank} size={24} />
        <Avatar name={m.displayName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-medium">
            {m.displayName}
            {isMe && <Badge tone="accent">você</Badge>}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-fg-muted">
            {m.wins}V · {m.losses}D{provisional && <Badge tone="neutral">provisório</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <RatingBar fill={fill} leader={m.rank === 1} width={64} />
          </div>
          <div className="w-12 text-right">
            <p className={`tabular font-semibold ${m.rank === 1 ? 'text-accent' : ''}`}>{m.rating}</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.02em] text-fg-subtle">pts</p>
          </div>
          <span aria-hidden className="text-fg-subtle">
            ›
          </span>
        </div>
      </Link>
    </li>
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
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <h2 className="font-medium">Entrar neste ranking</h2>
      <p className="mt-1 text-sm text-fg-muted">Confirme como seu nome deve aparecer.</p>
      <form onSubmit={onSubmit} className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <input {...register('displayName')} placeholder="Seu nome" className={inputClass} autoComplete="off" />
          {errors.displayName && <p className="mt-1.5 text-xs text-danger">{errors.displayName.message}</p>}
        </div>
        <Button type="submit" disabled={join.isPending}>
          {join.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </section>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-fg-muted">{children}</div>
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {[0, 1, 2, 3].map(i => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <span className="w-6" />
          <span className="size-10 animate-pulse rounded-full bg-surface-2" />
          <span className="h-4 flex-1 animate-pulse rounded bg-surface-2" style={{ maxWidth: 140 }} />
          <span className="h-4 w-8 animate-pulse rounded bg-surface-2" />
        </li>
      ))}
    </ul>
  )
}
