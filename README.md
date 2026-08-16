# 🎾 Deuce

Ranking de tênis para um grupo de amigos. Cada jogador tem um rating **Elo** que sobe ou desce a cada partida, conforme a força do adversário. MVP em individual; duplas depois.

## Stack

Vite + React 19 + TypeScript · Tailwind v4 · React Query · react-hook-form + zod · Biome · **Firebase** (Auth + Firestore + Hosting). Convenções herdadas do `bliss-frontend-template` (ver [AGENTS.md](./AGENTS.md)).

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha com a config do seu projeto Firebase
pnpm dev
```

## Setup do Firebase (uma vez)

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. **Authentication** → Sign-in method → habilite **Google**.
3. **Firestore Database** → criar em modo produção.
4. **Project settings** → *Your apps* → registre um app **Web** e copie a config do SDK para o `.env.local` (variáveis `VITE_FIREBASE_*`).
5. Instale a CLI e publique regras + app:

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add                 # selecione o projeto
   firebase deploy --only firestore:rules
   pnpm build && firebase deploy --only hosting
   ```

## Estrutura

```
src/
  features/
    auth/       # AuthProvider (Firebase Auth, Google)
    players/    # tipos + hooks React Query (usePlayers, useAddPlayer)
    matches/    # tipos + hooks (useRecordMatch — transação Elo)
    ranking/    # elo.ts (lógica pura) + elo.test.ts
  components/   # UI compartilhada (Button, AppLayout)
  pages/        # telas roteadas (Login, Leaderboard, RecordMatch)
  lib/          # firebase.ts
```

## Como o Elo funciona

Todo jogador começa em **1200**. Após uma partida, o vencedor ganha e o perdedor perde a mesma quantidade de pontos — quanto mais improvável o resultado, maior o swing (`K = 32`). A matemática vive isolada em [`src/features/ranking/elo.ts`](src/features/ranking/elo.ts), coberta por testes.

## Scripts

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm test` | testes unitários do Elo (vitest) |
| `pnpm lint:fix` | Biome (lint + format) |
| `pnpm build` | typecheck + build de produção |
