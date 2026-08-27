import { CallableRequest, HttpsError } from 'firebase-functions/v2/https'
import { db } from '../admin'
import { hashIp } from './crypto'

export type ActivityType =
  | 'upload'
  | 'edit'
  | 'delete'
  | 'code_created'
  | 'code_revoked'
  | 'code_redeemed'
  | 'code_failed'
  | 'admin_login'
  | 'download'

/** Melempar error kalau caller bukan admin. Dipanggil di awal SETIAP function admin-only. */
export function requireAdmin(request: CallableRequest): string {
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang boleh melakukan aksi ini.')
  }
  return request.auth.uid
}

export function getClientIpHash(request: CallableRequest): string | null {
  const ip = request.rawRequest?.ip
  return ip ? hashIp(ip) : null
}

export async function logActivity(params: {
  type: ActivityType
  actorType: 'admin' | 'public'
  actorId: string | null
  documentId: string | null
  documentTitle?: string
  metadata?: Record<string, unknown>
  ipHash?: string | null
}) {
  await db.collection('activityLogs').add({
    type: params.type,
    actorType: params.actorType,
    actorId: params.actorId,
    documentId: params.documentId,
    documentTitle: params.documentTitle ?? null,
    metadata: params.metadata ?? {},
    ipHash: params.ipHash ?? null,
    createdAt: Date.now(),
  })
}

const PREVIEW_TYPE_MAP: Record<string, string> = {
  pdf: 'pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  txt: 'text',
  csv: 'text',
  md: 'text',
  doc: 'office',
  docx: 'office',
  xls: 'office',
  xlsx: 'office',
  ppt: 'office',
  pptx: 'office',
}

export function resolvePreviewType(extension: string): string {
  return PREVIEW_TYPE_MAP[extension.toLowerCase()] ?? 'unsupported'
}

export function getExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}
