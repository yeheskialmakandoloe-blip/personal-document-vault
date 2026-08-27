import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { authAdmin, REGION } from '../admin'
import { requireAdmin, logActivity } from '../utils/helpers'

/**
 * Hanya admin yang sudah ada yang bisa menjadikan user lain admin.
 * Admin PERTAMA tidak dibuat lewat function ini (client tanpa admin tidak
 * bisa memanggil requireAdmin) — gunakan scripts/bootstrap-admin.mjs sekali
 * saja lewat service account, lihat README.
 */
export const setAdminClaim = onCall({ region: REGION }, async (request) => {
  const callerUid = requireAdmin(request)
  const { targetUid } = request.data as { targetUid: string }
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid wajib diisi.')

  await authAdmin.setCustomUserClaims(targetUid, { role: 'admin' })

  await logActivity({
    type: 'edit',
    actorType: 'admin',
    actorId: callerUid,
    documentId: null,
    metadata: { action: 'grant_admin', targetUid },
  })

  return { success: true as const }
})
