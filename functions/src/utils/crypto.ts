import { createHash, randomBytes } from 'crypto'

/**
 * Kode verifikasi TIDAK PERNAH disimpan sebagai plaintext.
 * Kita simpan SHA-256 hash-nya saja; plaintext hanya dikembalikan sekali ke
 * admin pada saat pembuatan, lalu dibuang dari memori function setelah response.
 */
export function hashCode(plaintext: string): string {
  return createHash('sha256').update(plaintext.trim().toUpperCase()).digest('hex')
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // tanpa 0/O/1/I agar tidak rancu

export function generateVerificationCode(length = 8): string {
  const bytes = randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return code
}

/** Hash IP untuk activity log — kita simpan jejak untuk rate limiting/audit
 * tanpa menyimpan IP mentah demi privasi. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}
