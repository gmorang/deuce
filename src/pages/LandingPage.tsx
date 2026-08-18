import { Link } from 'react-router-dom'
import './landing.css'

const Check = () => (
  <svg
    className="chk"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/** Public marketing landing — ported from the design system's landing kit. */
export function LandingPage() {
  return (
    <div className="lp" data-theme="dark">
      <nav className="nav">
        <div className="wrap nav-in">
          <div className="brand">
            <span className="dot" /> Deuce
          </div>
          <div className="nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#elo">Como funciona</a>
            <a href="#rodadas">Rodadas</a>
          </div>
          <div className="nav-cta">
            <Link className="btn btn-ghost" to="/login">
              Entrar
            </Link>
            <Link className="btn btn-primary" to="/login">
              Criar ranking
            </Link>
          </div>
        </div>
      </nav>

      <header className="hero wrap">
        <span className="pill">
          <b>Novo</b> Rodadas com sorteio automático 🎾
        </span>
        <h1 className="hero-h">
          O ranking de tênis do seu grupo, <span className="grad">levado a sério.</span>
        </h1>
        <p className="sub">
          Cada partida move o rating. Cada semana tem uma rodada. O Deuce cuida do Elo, dos confrontos e da classificação — vocês só precisam jogar.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" to="/login">
            Criar ranking grátis
          </Link>
          <a className="btn btn-ghost btn-lg" href="#recursos">
            Ver demonstração ›
          </a>
        </div>
        <p className="hero-note">Entre com o Google · Sem cartão · Pronto em 30 segundos</p>

        <div className="shot">
          <div className="shot-frame">
            <div className="shot-bar">
              <span className="tl" style={{ background: '#ff5f57' }} />
              <span className="tl" style={{ background: '#febc2e' }} />
              <span className="tl" style={{ background: '#28c840' }} />
              <span style={{ marginLeft: 12, fontSize: 12.5, color: 'var(--fg-subtle)' }}>deuce.app / r / ranking-da-firma</span>
            </div>
            <div className="shot-body">
              <aside className="lb-side">
                <div className="brand" style={{ padding: '0 6px 18px', fontSize: 15 }}>
                  <span className="dot" /> Deuce
                </div>
                <div className="side-item on">🏆 Rankings</div>
                <div className="side-item">＋ Novo ranking</div>
              </aside>
              <div className="lb-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <span
                    className="av"
                    style={{ background: 'var(--rank-green-bg)', color: 'var(--rank-green-fg)', width: 38, height: 38, borderRadius: 9, fontSize: 18 }}
                  >
                    🎾
                  </span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.02em' }}>Ranking da firma</div>
                    <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Toda sexta, quadra do clube</div>
                  </div>
                </div>
                <div className="lb-h">
                  <h3>Classificação</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>7 jogadores</span>
                </div>
                <div className="lb-list">
                  {SHOT_ROWS.map(r => (
                    <div key={r.name} className={`row${r.me ? ' me' : ''}`}>
                      {r.medal ? (
                        <span
                          className="medal"
                          style={{
                            background: `color-mix(in srgb, var(--${r.medal}) 15%, transparent)`,
                            color: r.medal === 'gold' ? 'var(--gold-fg)' : `var(--${r.medal})`,
                            boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--${r.medal}) 30%, transparent)`,
                          }}
                        >
                          {r.rank}
                        </span>
                      ) : (
                        <span className="rk">{r.rank}</span>
                      )}
                      <span className="av" style={{ background: r.avBg, color: r.avFg }}>
                        {r.initials}
                      </span>
                      <div className="nm">
                        <b>
                          {r.name}{' '}
                          {r.me && (
                            <span
                              className="badge"
                              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', display: 'inline' }}
                            >
                              você
                            </span>
                          )}
                        </b>
                        <span>{r.record}</span>
                      </div>
                      <div className="bar-t">
                        <div className="bar-f" style={{ width: `${r.fill}%`, background: r.me ? 'var(--accent)' : 'var(--fg-subtle)' }} />
                      </div>
                      <div className="pts">
                        <b style={r.me ? { color: 'var(--accent)' } : undefined}>{r.pts}</b>
                        <span>pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="strip wrap">
        <p>Feito para quem leva o racha a sério</p>
        <div className="strip-row">
          <span>🎾 Rachas de fim de semana</span>
          <span>🏢 Ligas da firma</span>
          <span>🏫 Turmas de aula</span>
          <span>🏆 Clubes de bairro</span>
          <span>👨‍👩‍👧 Copas de família</span>
        </div>
      </div>

      <section className="blk wrap" id="recursos">
        <span className="eyebrow">RECURSOS</span>
        <h2 className="sec">Tudo que um ranking precisa. Nada que atrapalhe.</h2>
        <p className="sec-sub">Registrar uma partida leva dois toques. O resto — pontos, posições, histórico — o Deuce resolve sozinho.</p>
        <div className="grid3">
          {FEATURES.map(f => (
            <div key={f.title} className="feat">
              <div className="ic">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="blk wrap" id="elo">
        <span className="eyebrow">COMO FUNCIONA</span>
        <div className="elo">
          <div>
            <h2 className="sec">O placar mais justo que o seu grupo já teve.</h2>
            <ul className="elo-pts">
              <li>
                <Check />
                <span>
                  <b>Todo jogador começa em 1200.</b> A partir daí, cada partida ajusta o rating conforme a força do adversário.
                </span>
              </li>
              <li>
                <Check />
                <span>
                  <b>Vencedor e perdedor trocam a mesma quantidade de pontos.</b> Quanto mais improvável o resultado, maior o swing.
                </span>
              </li>
              <li>
                <Check />
                <span>
                  <b>Você controla a volatilidade.</b> Estável, Normal ou Reativo — o K-factor define o quão rápido o rating se mexe.
                </span>
              </li>
            </ul>
            <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
              <Link className="btn btn-primary btn-lg" to="/login">
                Começar agora
              </Link>
            </div>
          </div>
          <div className="elo-card">
            <div style={{ fontSize: 13, color: 'var(--fg-subtle)', marginBottom: 6 }}>Partida registrada</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
              Marina venceu Diego <span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>· 6-3 6-4</span>
            </div>
            <div className="swing">
              <div className="who">
                <span className="av" style={{ background: '#dcfce7', color: '#166534' }}>
                  MA
                </span>
                <div>
                  <b style={{ fontSize: 14, fontWeight: 500 }}>Marina Alves</b>
                  <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>1618 → 1642</div>
                </div>
              </div>
              <span className="delta up">+24</span>
            </div>
            <div className="swing">
              <div className="who">
                <span className="av" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  DM
                </span>
                <div>
                  <b style={{ fontSize: 14, fontWeight: 500 }}>Diego Martins</b>
                  <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>1444 → 1420</div>
                </div>
              </div>
              <span className="delta down">−24</span>
            </div>
            <div
              style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--fg-subtle)', textAlign: 'center' }}
            >
              K = 32 · resultado esperado, swing moderado
            </div>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="rodadas">
        <div className="cta">
          <h2>Abra o primeiro ranking hoje à noite.</h2>
          <p>Convide o grupo, registre o primeiro jogo e veja a classificação ganhar vida. Grátis para sempre para grupos pequenos.</p>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary btn-lg" to="/login">
              Criar ranking grátis
            </Link>
            <a className="btn btn-ghost btn-lg" href="#recursos">
              Saber mais
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <div className="brand">
            <span className="dot" /> Deuce
          </div>
          <div>Ranking de tênis do grupo · © 2026</div>
        </div>
      </footer>
    </div>
  )
}

interface ShotRow {
  rank: number
  medal?: 'gold' | 'silver' | 'bronze'
  me?: boolean
  name: string
  initials: string
  avBg: string
  avFg: string
  record: string
  fill: number
  pts: number
}

const SHOT_ROWS: ShotRow[] = [
  { rank: 1, medal: 'gold', me: true, name: 'Marina Alves', initials: 'MA', avBg: '#dcfce7', avFg: '#166534', record: '14V · 3D', fill: 100, pts: 1642 },
  { rank: 2, medal: 'silver', name: 'Rafael Souza', initials: 'RS', avBg: '#dbeafe', avFg: '#1e40af', record: '11V · 6D', fill: 74, pts: 1531 },
  { rank: 3, medal: 'bronze', name: 'Bianca Costa', initials: 'BC', avBg: '#fef3c7', avFg: '#92400e', record: '9V · 7D', fill: 66, pts: 1498 },
  { rank: 4, name: 'Diego Martins', initials: 'DM', avBg: '#ede9fe', avFg: '#5b21b6', record: '7V · 9D', fill: 48, pts: 1420 },
  { rank: 5, name: 'Lucas Pereira', initials: 'LP', avBg: '#ffedd5', avFg: '#9a3412', record: '6V · 10D', fill: 38, pts: 1388 },
]

const FEATURES = [
  {
    icon: '📈',
    title: 'Rating Elo de verdade',
    body: 'Todo mundo começa em 1200. Ganhar de quem está acima vale mais; perder para quem está abaixo dói mais. É justo por definição.',
  },
  {
    icon: '⚡',
    title: 'Registro em segundos',
    body: 'Escolha vencedor, perdedor e placar. Os pontos são recalculados na hora e a classificação já aparece atualizada.',
  },
  {
    icon: '🎲',
    title: 'Rodadas com sorteio',
    body: 'Confirme presença, deixe o Deuce sortear os confrontos por rodízio — sem repetir dupla — e registre resultado por jogo.',
  },
  {
    icon: '🏅',
    title: 'Pódio e provisórios',
    body: 'Ouro, prata e bronze destacados. Jogadores novos entram como “provisório” até jogarem o suficiente para valer.',
  },
  {
    icon: '🎨',
    title: 'Vários rankings, cada um com sua cara',
    body: 'Um ícone, uma cor, um K-factor. Firma, família e clube podem viver lado a lado, cada um com suas próprias regras.',
  },
  { icon: '🔒', title: 'Entrar é com o Google', body: 'Sem senha, sem cadastro. Admins gerenciam; todo mundo vê a classificação e confirma presença.' },
] as const
