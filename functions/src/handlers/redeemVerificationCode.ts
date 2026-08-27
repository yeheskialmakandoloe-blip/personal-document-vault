import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, storage, REGION } from '../admin'
import { hashCode } from '../utils/crypto'
import { assertNotRateLimited, resetRateLimit } from '../utils/rateLimit'
import { getClientIpHash, logActivity } from '../utils/helpers'

const DOWNLOAD_EXPIRY_SECONDS = 2 * 60 // link download hanya berlaku 2 menit

export const redeemVerificationCode = onCall({ region: REGION }, async (request) => {
  const { documentId, code } = request.data as { documentId: string; code: string }
  if (!documentId || !code) {
    throw new HttpsError('invalid-argument', 'documentId dan code wajib diisi.')
  }

  const ipHash = getClientIpHash(request)
  const bucketKey = `${documentId}:${ipHash ?? 'unknown'}`

  // Cek rate limit SEBELUM melakukan query apa pun ke Firestore untuk kode,
  // supaya percobaan brute-force tidak bisa membanjiri baca Firestore juga.
  await assertNotRateLimited(bucketKey)

  const codeHash = hashCode(code)

  const codesQuery = await db
    .collection('verificationCodes')
    .where('documentId', '==', documentId)
    .where('codeHash', '==', codeHash)
    .limit(1)
    .get()

  if (codesQuery.empty) {
    await logActivity({
      type: 'code_failed',
      actorType: 'public',
      actorId: null,
      documentId,
      metadata: { reason: 'not_found' },
      ipHash,
    })
    throw new HttpsError('permission-denied', 'Kode tidak valid.')
  }

  const codeDoc = codesQuery.docs[0]
  const codeRef = codeDoc.ref

  // Transaction: validasi ulang + increment usedCount secara atomik, supaya
  // dua request bersamaan dengan kode maxUses=1 tidak bisa lolos berdua-duanya.
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(codeRef)
    const data = snap.data()!
    const now = Date.now()

    if (data.isRevoked) return { ok: false as const, reason: 'revoked' }
    if (data.expiresAt < now) return { ok: false as const, reason: 'expired' }
    if (data.usedCount >= data.maxUses) return { ok: false as const, reason: 'exhausted' }

    tx.update(codeRef, {
      usedCount: data.usedCount + 1,
      usageHistory: [
        ...(data.usageHistory ?? []),
        { usedAt: now, ipHash, userAgent: request.rawRequest?.headers['user-agent'] ?? null },
      ],
    })

    return { ok: true as const, documentId: data.documentId as string }
  })

  if (!result.ok) {
    await logActivity({
      type: 'code_failed',
      actorType: 'public',
      actorId: null,
      documentId,
      metadata: { reason: result.reason },
      ipHash,
    })
    throw new HttpsError('permission-denied', 'Kode sudah tidak berlaku.')
  }

  // Kode valid — reset rate limit bucket ini supaya orang yang benar tidak
  // terkunci gara-gara percobaan salah ketik sebelumnya.
  await resetRateLimit(bucketKey)

  const [docSnap, storageSnap] = await Promise.all([
    db.collection('documents').doc(documentId).get(),
    db.collection('documentStorage').doc(documentId).get(),
  ])
  if (!docSnap.exists || !storageSnap.exists) {
    throw new HttpsError('not-found', 'Dokumen tidak ditemukan.')
  }
  const { storagePath } = storageSnap.data() as { storagePath: string }
  const docData = docSnap.data()!

  const [url] = await storage
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + DOWNLOAD_EXPIRY_SECONDS * 1000,
      responseDisposition: `attachment; filename="${docData.fileName}"`,
    })

  await Promise.all([
    db.collection('documents').doc(documentId).update({
      downloadCount: (docData.downloadCount ?? 0) + 1,
    }),
    logActivity({
      type: 'code_redeemed',
      actorType: 'public',
      actorId: null,
      documentId,
      documentTitle: docData.title,
      ipHash,
    }),
  ])

  return { url, expiresInSeconds: DOWNLOAD_EXPIRY_SECONDS, fileName: docData.fileName }
})
