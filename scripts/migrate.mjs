/**
 * One-time migration/backfill. Brings existing data up to the current model:
 *  - rankings: fill missing `type`, `archived`, `settings.*`, and generate an
 *    `inviteCode` (+ its public `inviteCodes/{code}` lookup doc) if absent.
 *  - members: ensure the `uid` field (used by the home's collection-group query).
 *
 * Runs with the Admin SDK, so it bypasses security rules.
 *
 * Setup:
 *   1. pnpm add -D firebase-admin
 *   2. Firebase Console → Project settings → Service accounts → Generate new
 *      private key → save as scripts/serviceAccountKey.json (gitignored).
 *   3. node scripts/migrate.mjs
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const genCode = (len = 6) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

const DEFAULT_SETTINGS = { startRating: 1200, kFactor: 32, provisionalEnabled: true, provisionalMatches: 3, defaultFormat: 'best3' }

async function run() {
  const rankings = await db.collection('rankings').get()
  console.log(`Migrando ${rankings.size} ranking(s)…\n`)

  for (const r of rankings.docs) {
    const data = r.data()
    const patch = {}

    if (typeof data.type !== 'string') patch.type = 'singles'
    if (typeof data.archived !== 'boolean') patch.archived = false

    const settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) }
    if (JSON.stringify(settings) !== JSON.stringify(data.settings)) patch.settings = settings

    if (!data.inviteCode) {
      const code = genCode()
      patch.inviteCode = code
      await db.doc(`inviteCodes/${code}`).set({ rankingId: r.id, startRating: settings.startRating, createdAt: Date.now(), createdBy: data.ownerId ?? null })
      console.log(`• ${r.id} "${data.name ?? ''}" → código ${code}`)
    }

    if (Object.keys(patch).length) await r.ref.set(patch, { merge: true })

    const members = await r.ref.collection('members').get()
    for (const m of members.docs) {
      if (m.data().uid !== m.id) await m.ref.set({ uid: m.id }, { merge: true })
    }
    console.log(`  ${members.size} membro(s) — uid garantido`)
  }

  console.log('\n✔ Migração concluída.')
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
