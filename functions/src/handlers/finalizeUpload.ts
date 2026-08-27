import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, storage, REGION } from '../admin'
import { requireAdmin, resolvePreviewType, getExtension, logActivity } from '../utils/helpers'

export const finalizeUpload = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { storagePath, title, description, category, isPublic } = request.data as {
    storagePath: string
    title: string
    description: string
    category: string
    isPublic: boolean
  }

  if (!storagePath || !storagePath.startsWith(`documents/${uid}/`)) {
    throw new HttpsError('invalid-argument', 'storagePath tidak valid.')
  }

  const file = storage.bucket().file(storagePath)
  const [exists] = await file.exists()
  if (!exists) {
    throw new HttpsError('failed-precondition', 'File belum selesai diupload ke Storage.')
  }
  const [metadata] = await file.getMetadata()

  const fileName = storagePath.split('/').pop() ?? storagePath
  const extension = getExtension(fileName)

  // PENTING: storagePath TIDAK disimpan di koleksi `documents` karena Firestore
  // Security Rules hanya bisa mengizinkan/menolak per DOKUMEN, bukan per FIELD.
  // Kalau storagePath ikut di sini, siapa pun yang boleh membaca dokumen publik
  // otomatis juga bisa membaca path Storage asli. Path disimpan terpisah di
  // koleksi `documentStorage`, yang rule-nya menolak semua akses client
  // (hanya Cloud Functions lewat Admin SDK yang bisa membacanya).
  const docRef = db.collection('documents').doc()
  const batch = db.batch()

  batch.set(docRef, {
    title: title || fileName,
    description: description || '',
    category: category || '',
    fileName,
    fileExtension: extension,
    mimeType: metadata.contentType || 'application/octet-stream',
    fileSize: Number(metadata.size ?? 0),
    previewType: resolvePreviewType(extension),
    isPublic: !!isPublic,
    uploadedBy: uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    downloadCount: 0,
  })
  batch.set(db.collection('documentStorage').doc(docRef.id), { storagePath })

  await batch.commit()

  await logActivity({
    type: 'upload',
    actorType: 'admin',
    actorId: uid,
    documentId: docRef.id,
    documentTitle: title || fileName,
  })

  return { documentId: docRef.id }
})
