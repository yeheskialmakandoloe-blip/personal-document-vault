import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, REGION } from '../admin'
import { requireAdmin, logActivity } from '../utils/helpers'
import { generateVerificationCode, hashCode } from '../utils/crypto'

export const createVerificationCode = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { documentId, expiresInHours, maxUses } = request.data as {
    documentId: string
    expiresInHours: number
    maxUses: number
  }

  if (!documentId || !expiresInHours || !maxUses || maxUses < 1 || expiresInHours < 1) {
    throw new HttpsError('invalid-argument', 'Parameter kode tidak valid.')
  }

  const docSnap = await db.collection('documents').doc(documentId).get()
  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'Dokumen tidak ditemukan.')
  }

  // Regenerasi jika (secara sangat tidak mungkin) terjadi tabrakan hash.
  let plaintextCode = generateVerificationCode()
  let codeHash = hashCode(plaintextCode)
  const clash = await db.collection('verificationCodes').where('codeHash', '==', codeHash).limit(1).get()
  if (!clash.empty) {
    plaintextCode = generateVerificationCode(10)
    codeHash = hashCode(plaintextCode)
  }

  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000

  const codeRef = await db.collection('verificationCodes').add({
    documentId,
    documentTitle: docSnap.data()!.title,
    codeHash, // plaintext TIDAK PERNAH disimpan
    createdBy: uid,
    createdAt: Date.now(),
    expiresAt,
    maxUses,
    usedCount: 0,
    isRevoked: false,
    isExpired: false,
    usageHistory: [],
  })

  await logActivity({
    type: 'code_created',
    actorType: 'admin',
    actorId: uid,
    documentId,
    documentTitle: docSnap.data()!.title,
    metadata: { codeId: codeRef.id, maxUses, expiresInHours },
  })

  return { codeId: codeRef.id, plaintextCode, expiresAt }
})

export const revokeVerificationCode = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { codeId } = request.data as { codeId: string }
  if (!codeId) throw new HttpsError('invalid-argument', 'codeId wajib diisi.')

  const ref = db.collection('verificationCodes').doc(codeId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Kode tidak ditemukan.')

  await ref.update({ isRevoked: true })

  await logActivity({
    type: 'code_revoked',
    actorType: 'admin',
    actorId: uid,
    documentId: snap.data()!.documentId,
    documentTitle: snap.data()!.documentTitle,
    metadata: { codeId },
  })

  return { success: true as const }
})
