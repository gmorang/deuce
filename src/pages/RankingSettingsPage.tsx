import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/Button'
import { IdentityPicker } from '../components/IdentityPicker'
import { useAuth } from '../features/auth/AuthProvider'
import { useIsAdmin } from '../features/auth/useIsAdmin'
import { MATCH_FORMATS, type MatchFormat } from '../features/matches/score'
import { DEFAULT_RANKING_COLOR, DEFAULT_RANKING_ICON } from '../features/rankings/identity'
import { DEFAULT_RANKING_SETTINGS, type Ranking } from '../features/rankings/types'
import { useDeleteRanking, useRanking, useRegenerateCode, useSetArchived, useUpdateRanking } from '../features/rankings/useRankings'

export function RankingSettingsPage() {
  const { rankingId } = useParams()
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin()
  const { data: ranking, isLoading } = useRanking(rankingId)

  if (adminLoading || isLoading) return null
  if (!isAdmin) return <Navigate to={`/r/${rankingId}`} replace />
  if (!ranking) return <Navigate to="/rankings" replace />

  return <SettingsForm ranking={ranking} />
}

const schema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto'),
  description: z.string().trim().max(280, 'Máximo 280 caracteres').optional(),
  startRating: z.coerce.number().int().min(0).max(5000),
  kFactor: z.coerce.number().int().min(1).max(200),
  provisionalEnabled: z.boolean(),
  provisionalMatches: z.coerce.number().int().min(1).max(50),
  defaultFormat: z.string(),
})
type Form = z.infer<typeof schema>

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-[var(--ring)]'

const K_PRESETS = [
  { value: 16, label: 'Estável' },
  { value: 32, label: 'Normal' },
  { value: 48, label: 'Reativo' },
]

function SettingsForm({ ranking }: { ranking: Ranking }) {
  const navigate = useNavigate()
  const update = useUpdateRanking(ranking.id)
  const setArchived = useSetArchived(ranking.id)
  const deleteRanking = useDeleteRanking()

  const settings = ranking.settings ?? DEFAULT_RANKING_SETTINGS
  const [icon, setIcon] = useState(ranking.icon ?? DEFAULT_RANKING_ICON)
  const [color, setColor] = useState(ranking.color ?? DEFAULT_RANKING_COLOR)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: ranking.name,
      description: ranking.description ?? '',
      startRating: settings.startRating,
      kFactor: settings.kFactor,
      provisionalEnabled: settings.provisionalEnabled ?? true,
      provisionalMatches: settings.provisionalMatches,
      defaultFormat: settings.defaultFormat ?? 'best3',
    },
  })

  const kFactor = watch('kFactor')
  const provisionalEnabled = watch('provisionalEnabled')
  const dirty = isDirty || icon !== ranking.icon || color !== ranking.color

  const onSubmit = handleSubmit(async values => {
    await update.mutateAsync({
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      icon,
      color,
      settings: {
        startRating: values.startRating,
        kFactor: values.kFactor,
        provisionalEnabled: values.provisionalEnabled,
        provisionalMatches: values.provisionalMatches,
        defaultFormat: values.defaultFormat as MatchFormat,
      },
    })
  })

  const onDelete = async () => {
    if (!window.confirm(`Excluir "${ranking.name}"? Isso apaga membros e partidas. Não dá pra desfazer.`)) return
    await deleteRanking.mutateAsync(ranking.id)
    navigate('/rankings')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/r/${ranking.id}`} className="text-sm text-fg-muted transition-colors hover:text-fg">
          ‹ {ranking.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Configurações</h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Básico */}
        <Section title="Básico">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Nome</span>
            <input {...register('name')} className={inputClass} autoComplete="off" />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Descrição (opcional)</span>
            <input {...register('description')} placeholder="Ex: Ranking da firma, toda sexta" className={inputClass} autoComplete="off" />
            {errors.description && <span className="text-xs text-danger">{errors.description.message}</span>}
          </label>
        </Section>

        {/* Identidade */}
        <Section title="Identidade">
          <IdentityPicker icon={icon} color={color} onIcon={setIcon} onColor={setColor} />
        </Section>

        {/* Partidas */}
        <Section title="Partidas">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Formato das partidas</span>
            <select {...register('defaultFormat')} className={inputClass}>
              {MATCH_FORMATS.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-fg-subtle">Usado em todas as partidas deste ranking.</span>
          </label>
        </Section>

        {/* Elo */}
        <Section title="Pontuação (Elo)">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Rating inicial</span>
            <input type="number" {...register('startRating')} className={inputClass} />
            <span className="text-xs text-fg-subtle">Vale para quem entrar a partir de agora.</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-muted">Volatilidade</span>
            <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
              {K_PRESETS.map(p => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setValue('kFactor', p.value, { shouldDirty: true })}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    kFactor === p.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-fg-subtle">Quão rápido o rating sobe/desce a cada partida (K = {kFactor}).</span>
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <label className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-fg-muted">Marcar jogadores novos como “provisório”</span>
                <span className="text-xs text-fg-subtle">Um selo avisando que o rating ainda é novo.</span>
              </span>
              <input type="checkbox" {...register('provisionalEnabled')} className="size-5 accent-[var(--accent)]" />
            </label>
            {provisionalEnabled && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-fg-muted">Partidas para sair de “provisório”</span>
                <input type="number" {...register('provisionalMatches')} className={inputClass} />
                {errors.provisionalMatches && <span className="text-xs text-danger">{errors.provisionalMatches.message}</span>}
              </label>
            )}
          </div>
        </Section>

        <Button type="submit" disabled={!dirty || update.isPending} className="w-full py-3">
          {update.isPending ? 'Salvando…' : update.isSuccess && !dirty ? 'Salvo ✓' : 'Salvar alterações'}
        </Button>
      </form>

      <InviteSection ranking={ranking} />

      {/* Zona de perigo */}
      <section className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <h2 className="font-medium text-danger">Zona de perigo</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{ranking.archived ? 'Ranking arquivado' : 'Arquivar ranking'}</p>
            <p className="text-xs text-fg-muted">Esconde da lista sem apagar os dados.</p>
          </div>
          <Button variant="outline" disabled={setArchived.isPending} onClick={() => setArchived.mutate(!ranking.archived)}>
            {ranking.archived ? 'Desarquivar' : 'Arquivar'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-danger/20 pt-3">
          <div>
            <p className="text-sm font-medium">Excluir ranking</p>
            <p className="text-xs text-fg-muted">Apaga membros e partidas. Não dá pra desfazer.</p>
          </div>
          <Button variant="danger" disabled={deleteRanking.isPending} onClick={onDelete}>
            {deleteRanking.isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </section>
    </div>
  )
}

function InviteSection({ ranking }: { ranking: Ranking }) {
  const { user } = useAuth()
  const regenerate = useRegenerateCode(ranking.id)
  const [copied, setCopied] = useState(false)
  const code = ranking.inviteCode ?? '—'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const onRegenerate = () => {
    if (!user) return
    if (!window.confirm('Gerar um novo código? O código atual deixa de funcionar.')) return
    regenerate.mutate({ oldCode: ranking.inviteCode, startRating: (ranking.settings ?? DEFAULT_RANKING_SETTINGS).startRating, ownerId: user.uid })
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-medium">Convite</h2>
        <p className="mt-1 text-sm text-fg-muted">Compartilhe o código para as pessoas entrarem neste ranking.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-center font-mono text-lg font-semibold tracking-[0.3em]">
          {code}
        </span>
        <Button variant="outline" onClick={copy}>
          {copied ? 'Copiado ✓' : 'Copiar'}
        </Button>
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={regenerate.isPending}
        className="self-start text-xs text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
      >
        {regenerate.isPending ? 'Gerando…' : 'Gerar novo código'}
      </button>
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  )
}
