import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db, storage, REGION } from '../admin'
import { requireAdmin, logActivity } from '../utils/helpers'

export const updateDocument = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { documentId, title, description, category, isPublic } = request.data as {
    documentId: string
    title?: string
    description?: string
    category?: string
    isPublic?: boolean
  }
  if (!documentId) throw new HttpsError('invalid-argument', 'documentId wajib diisi.')

  const ref = db.collection('documents').doc(documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Dokumen tidak ditemukan.')

  const updates: Record<string, unknown> = { updatedAt: Date.now() }
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (category !== undefined) updates.category = category
  if (isPublic !== undefined) updates.isPublic = isPublic

  await ref.update(updates)

  await logActivity({
    type: 'edit',
    actorType: 'admin',
    actorId: uid,
    documentId,
    documentTitle: (updates.title as string) ?? snap.data()!.title,
    metadata: updates,
  })

  return { success: true as const }
})

export const deleteDocument = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { documentId } = request.data as { documentId: string }
  if (!documentId) throw new HttpsError('invalid-argument', 'documentId wajib diisi.')

  const docRef = db.collection('documents').doc(documentId)
  const storageRef = db.collection('documentStorage').doc(documentId)

  const [docSnap, storageSnap] = await Promise.all([docRef.get(), storageRef.get()])
  if (!docSnap.exists) throw new HttpsError('not-found', 'Dokumen tidak ditemukan.')

  if (storageSnap.exists) {
    const { storagePath } = storageSnap.data() as { storagePath: string }
    await storage.bucket().file(storagePath).delete({ ignoreNotFound: true })
  }

  // Hapus juga kode verifikasi terkait supaya tidak menjadi entri yatim.
  const relatedCodes = await db
    .collection('verificationCodes')
    .where('documentId', '==', documentId)
    .get()

  const batch = db.batch()
  batch.delete(docRef)
  batch.delete(storageRef)
  relatedCodes.docs.forEach((c) => batch.delete(c.ref))
  await batch.commit()

  await logActivity({
    type: 'delete',
    actorType: 'admin',
    actorId: uid,
    documentId,
    documentTitle: docSnap.data()!.title,
  })

  return { success: true as const }
})
