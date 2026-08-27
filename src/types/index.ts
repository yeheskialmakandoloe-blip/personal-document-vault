export type PreviewType = 'pdf' | 'image' | 'text' | 'office' | 'unsupported'

export interface VaultDocument {
  id: string
  title: string
  description: string
  category: string
  fileName: string
  fileExtension: string
  mimeType: string
  fileSize: number
  previewType: PreviewType
  isPublic: boolean
  uploadedBy: string
  createdAt: number
  updatedAt: number
  downloadCount: number
  // storagePath TIDAK ada di sini dengan sengaja — client publik tidak pernah
  // menerima path Storage asli, hanya signed URL sementara dari Cloud Function.
}

export interface VerificationCodeSummary {
  id: string
  documentId: string
  documentTitle: string
  createdAt: number
  expiresAt: number
  maxUses: number
  usedCount: number
  isRevoked: boolean
  isExpired: boolean
}

export interface ActivityLog {
  id: string
  type:
    | 'upload'
    | 'edit'
    | 'delete'
    | 'code_created'
    | 'code_revoked'
    | 'code_redeemed'
    | 'code_failed'
    | 'admin_login'
    | 'download'
  actorType: 'admin' | 'public'
  actorId: string | null
  documentId: string | null
  documentTitle?: string
  metadata: Record<string, unknown>
  createdAt: number
}

export interface AdminUser {
  uid: string
  email: string
  displayName: string
}
