// Invite codes are short, human-typeable, and avoid ambiguous characters
// (no 0/O, 1/I/L). Generated with the Web Crypto API.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateInviteCode(length = 6): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let code = ''
  for (let i = 0; i < length; i++) code += ALPHABET[values[i] % ALPHABET.length]
  return code
}

/** Normalize user-typed codes: trim, uppercase, strip spaces/dashes. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '')
}
