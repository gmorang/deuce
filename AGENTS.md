# AI Assistant Rules — Deuce

Single source of truth for any AI assistant generating code in this repo. Follow it strictly.

Deuce is a tennis ranking web app for a group of friends. Individual matches now, doubles later. Ratings use the **Elo** system.

## Stack (fixed)

| Need | Library | Notes |
|------|---------|-------|
| Build / dev | **Vite** + React 19 + TypeScript | `pnpm dev`, `pnpm build` |
| Package manager | **pnpm** | never `npm`/`yarn` |
| Lint + format | **Biome** | `pnpm lint`, `pnpm lint:fix`. No ESLint/Prettier. |
| Routing | **react-router-dom v7** | `import { Link, useNavigate } from 'react-router-dom'` |
| Server state | **@tanstack/react-query** | every Firestore read/write goes through `useQuery` / `useMutation` |
| Forms | **react-hook-form + zod** | `zodResolver`; never ad-hoc `useState` forms |
| Styling | **Tailwind v4** | via `@tailwindcss/vite`; tokens in `src/index.css` `@theme` (`court`, `clay`, …) |
| Backend | **Firebase** (Auth + Firestore + Hosting) | config in `src/lib/firebase.ts` |

These conventions mirror `bliss-frontend-template`, minus the platform-coupled pieces (`@saudebliss/*` packages, Module Federation, BFF) which don't apply to a standalone Firebase app.

## Do

- Keep **server state in React Query**, not `useState`. Invalidate the right `queryKey` after a mutation.
- Put **domain logic in `src/features/<domain>/`**; shared UI in `src/components/`; routed screens in `src/pages/`.
- Keep the **Elo math pure** in `src/features/elo/elo.ts`, covered by `elo.test.ts`. Any rating change lives there — never inline in a component or service.
- Write **matches as append-only** and update ratings inside a **Firestore transaction** (see `useRecordMatch`).
- Use **zod schemas** for every form; infer the type with `z.infer`.

## Don't

- Don't use `npm`/`yarn` — pnpm only.
- Don't add ESLint, Prettier, or a component library — Biome + local components.
- Don't reintroduce Module Federation or `@saudebliss/*` — this app is standalone.
- Don't recompute ratings anywhere except `elo.ts`.
- Don't commit `.env.local` (gitignored). Firebase web config isn't secret, but keep it out of git anyway.

## Data model (Firestore) — multi-ranking

Ratings are **per ranking**: a member's Elo lives inside the ranking they joined.

- `users/{uid}`: canonical profile (`displayName, photoURL?, email?, role, createdAt, lastSeenAt`), upserted on login. Self-writable **except `role`** — a user can't promote themselves; only an admin or the console changes role (rules enforce). `role: 'admin'` can create/manage rankings. Bootstrap the first admin in the console. `members` denormalize the name from here for fast leaderboard reads.
- `rankings/{id}`: `name, description?, icon, color, ownerId, archived, createdAt, settings {startRating, kFactor, provisionalMatches}`. Only admins create/update/delete. Admin-only Settings screen at `/r/:id/config` edits identity + Elo settings + archive/delete. Elo settings thread into join (startRating), record-match (kFactor, read in the transaction), and leaderboard (provisional badge). Rules validate a member's starting rating against the ranking's `startRating`.
- `rankings/{id}/members/{uid}`: `displayName, photoURL?, rating, wins, losses, matchesPlayed, joinedAt`. A user **joins** by creating their own member doc (uid-keyed).
- `rankings/{id}/matches/{matchId}`: `winnerId, loserId, score?, winner/loserRatingBefore/After, ratingDelta, playedAt, recordedBy` — append-only (admin may delete).
- `rankings/{id}/rounds/{roundId}`: weekly draw — `number, status (confirming|drawn|closed), byeId?, byeName?`. Admin opens/draws/closes. Sub: `participants/{uid}` (self-confirm attendance), `fixtures/{id}` (`aId,aName,bId,bName,status,matchId?,winnerId?,score?`). Draw uses `features/rounds/draw.ts` (rodízio = optimal min-repeat matching, tested). Fixture result reuses `applyMatchInTransaction` (matches) so Elo + fixture update are atomic. Free-form (avulso) recording still available.

Security rules live in `firestore.rules`. Rating updates are trust-based for now (a Cloud Function would make them tamper-proof). Planned: match result goes **pending → opponent approves** before Elo applies.

Elo math is isolated in `src/features/elo/elo.ts` (tested). Features: `auth`, `elo`, `rankings` (rankings + members), `matches`.

## Commands

```bash
pnpm dev          # local dev server
pnpm test         # run Elo unit tests (vitest)
pnpm lint:fix     # biome autofix
pnpm build        # tsc -b && vite build
```
