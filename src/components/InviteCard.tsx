import { useState } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { DEFAULT_RANKING_SETTINGS, type Ranking } from '../features/rankings/types'
import { useRegenerateCode } from '../features/rankings/useRankings'
import { Button } from './Button'
import { InviteButton } from './InviteButton'

/** Prominent invite block on the ranking page so any member can invite. Admins
 * can generate a code for older rankings that don't have one yet. */
export function InviteCard({ ranking, isAdmin }: { ranking: Ranking; isAdmin: boolean }) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const regenerate = useRegenerateCode(ranking.id)
  const code = ranking.inviteCode

  const copy = async () => {
    if (!code) return
    const ok = await navigator.clipboard
      .writeText(code)
      .then(() => true)
      .catch(() => false)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const generate = () => {
    if (!user) return
    regenerate.mutate({ startRating: (ranking.settings ?? DEFAULT_RANKING_SETTINGS).startRating, ownerId: user.uid })
  }

  if (!code) {
    if (!isAdmin) return null
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
        <h2 className="font-medium">Convidar pessoas</h2>
        <p className="mt-1 text-sm text-fg-muted">Este ranking ainda não tem um código de convite.</p>
        <Button variant="outline" onClick={generate} disabled={regenerate.isPending} className="mt-4">
          {regenerate.isPending ? 'Gerando…' : 'Gerar código'}
        </Button>
        {regenerate.isError && <p className="mt-2 text-xs text-danger">{(regenerate.error as Error)?.message ?? 'Erro ao gerar o código.'}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <h2 className="font-medium">Convidar pessoas</h2>
      <p className="mt-1 text-sm text-fg-muted">Compartilhe o código para o pessoal entrar neste ranking.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-center font-mono text-lg font-semibold tracking-[0.3em]">
          {code}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copy} className="flex-1 sm:flex-none">
            {copied ? 'Copiado ✓' : 'Copiar'}
          </Button>
          <InviteButton code={code} name={ranking.name} />
        </div>
      </div>
    </section>
  )
}
