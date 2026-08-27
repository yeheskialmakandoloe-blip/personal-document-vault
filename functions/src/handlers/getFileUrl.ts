import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, storage, REGION } from '../admin'
import { logActivity } from '../utils/helpers'

const PREVIEW_EXPIRY_SECONDS = 5 * 60 // 5 menit — cukup untuk memuat preview
const ADMIN_DOWNLOAD_EXPIRY_SECONDS = 60 // admin download langsung, tidak perlu lama

export const getFileUrl = onCall({ region: REGION }, async (request) => {
  const { documentId, mode } = request.data as {
    documentId: string
    mode: 'preview' | 'download'
  }
  if (!documentId || !mode) {
    throw new HttpsError('invalid-argument', 'documentId dan mode wajib diisi.')
  }

  const isAdmin = request.auth?.token?.role === 'admin'

  const docSnap = await db.collection('documents').doc(documentId).get()
  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'Dokumen tidak ditemukan.')
  }
  const doc = docSnap.data()!

  // Aturan akses:
  // - preview: boleh untuk siapa saja SELAMA dokumen isPublic == true, atau admin.
  // - download tanpa kode: HANYA admin. Public wajib lewat redeemVerificationCode.
  if (!isAdmin) {
    if (!doc.isPublic) {
      throw new HttpsError('permission-denied', 'Dokumen ini bersifat privat.')
    }
    if (mode === 'download') {
      throw new HttpsError(
        'permission-denied',
        'Download memerlukan kode verifikasi dari admin.',
      )
    }
  }

  const storageSnap = await db.collection('documentStorage').doc(documentId).get()
  if (!storageSnap.exists) {
    throw new HttpsError('not-found', 'File pada dokumen ini tidak ditemukan.')
  }
  const { storagePath } = storageSnap.data() as { storagePath: string }

  const expiresInSeconds = mode === 'preview' ? PREVIEW_EXPIRY_SECONDS : ADMIN_DOWNLOAD_EXPIRY_SECONDS
  const [url] = await storage
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    })

  if (mode === 'download' && isAdmin) {
    await logActivity({
      type: 'download',
      actorType: 'admin',
      actorId: request.auth!.uid,
      documentId,
      documentTitle: doc.title,
    })
  }

  return { url, expiresInSeconds }
})
