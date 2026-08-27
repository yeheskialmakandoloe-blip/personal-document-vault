import { HttpsError } from 'firebase-functions/v2/https'
import { db } from '../admin'

const WINDOW_MS = 10 * 60 * 1000 // 10 menit
const MAX_ATTEMPTS = 5

/**
 * Membatasi jumlah percobaan gagal per kombinasi (bucketKey) dalam window waktu.
 * bucketKey sebaiknya kombinasi documentId + ipHash agar satu orang mencoba
 * banyak dokumen atau banyak orang mencoba satu dokumen tetap dibatasi wajar.
 * Menggunakan transaction supaya aman dari race condition percobaan paralel.
 */
export async function assertNotRateLimited(bucketKey: string): Promise<void> {
  const ref = db.collection('rateLimits').doc(bucketKey)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()

    if (!snap.exists) {
      tx.set(ref, { count: 1, windowStart: now })
      return
    }

    const data = snap.data() as { count: number; windowStart: number }
    const windowExpired = now - data.windowStart > WINDOW_MS

    if (windowExpired) {
      tx.set(ref, { count: 1, windowStart: now })
      return
    }

    if (data.count >= MAX_ATTEMPTS) {
      throw new HttpsError(
        'resource-exhausted',
        'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.',
      )
    }

    tx.update(ref, { count: data.count + 1 })
  })
}

/** Reset counter setelah percobaan berhasil, agar tidak menghukum penggunaan wajar. */
export async function resetRateLimit(bucketKey: string): Promise<void> {
  await db.collection('rateLimits').doc(bucketKey).delete().catch(() => undefined)
}
