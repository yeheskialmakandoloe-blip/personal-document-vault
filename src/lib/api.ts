import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

// Setiap fungsi di sini adalah pemanggil ke Cloud Function bertipe "callable".
// Firebase otomatis menyertakan Auth ID token + App Check token di tiap panggilan,
// jadi function di server bisa memverifikasi identitas & keaslian aplikasi.

export interface UploadUrlRequest {
  fileName: string
  mimeType: string
  fileSize: number
}
export interface UploadUrlResponse {
  uploadUrl: string
  storagePath: string
  token: string
}
export const requestUploadUrl = httpsCallable<UploadUrlRequest, UploadUrlResponse>(
  functions,
  'requestUploadUrl',
)

export interface FinalizeUploadRequest {
  storagePath: string
  title: string
  description: string
  category: string
  isPublic: boolean
}
export const finalizeUpload = httpsCallable<FinalizeUploadRequest, { documentId: string }>(
  functions,
  'finalizeUpload',
)

export const updateDocument = httpsCallable<
  { documentId: string; title?: string; description?: string; category?: string; isPublic?: boolean },
  { success: true }
>(functions, 'updateDocument')

export const deleteDocument = httpsCallable<{ documentId: string }, { success: true }>(
  functions,
  'deleteDocument',
)

export interface GetFileUrlRequest {
  documentId: string
  mode: 'preview' | 'download'
}
export interface GetFileUrlResponse {
  url: string
  expiresInSeconds: number
}
// Untuk dokumen publik + mode "preview", tidak perlu kode.
// Untuk mode "download" pada dokumen publik, backend akan menolak kecuali admin —
// public harus lewat redeemVerificationCode di bawah.
export const getFileUrl = httpsCallable<GetFileUrlRequest, GetFileUrlResponse>(
  functions,
  'getFileUrl',
)

export interface CreateCodeRequest {
  documentId: string
  expiresInHours: number
  maxUses: number
}
export interface CreateCodeResponse {
  codeId: string
  plaintextCode: string // hanya dikembalikan SEKALI, tidak pernah disimpan plaintext
  expiresAt: number
}
export const createVerificationCode = httpsCallable<CreateCodeRequest, CreateCodeResponse>(
  functions,
  'createVerificationCode',
)

export const revokeVerificationCode = httpsCallable<{ codeId: string }, { success: true }>(
  functions,
  'revokeVerificationCode',
)

export interface RedeemCodeRequest {
  documentId: string
  code: string
}
export interface RedeemCodeResponse {
  url: string
  expiresInSeconds: number
  fileName: string
}
export const redeemVerificationCode = httpsCallable<RedeemCodeRequest, RedeemCodeResponse>(
  functions,
  'redeemVerificationCode',
)
