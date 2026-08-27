import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { randomUUID } from 'crypto'
import { storage } from '../admin'
import { requireAdmin } from '../utils/helpers'
import { REGION } from '../admin'

const ALLOWED_MIME_PREFIXES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'image/',
  'text/',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // fallback untuk DWG/SKP yang seringkali tanpa MIME spesifik
]

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB

export const requestUploadUrl = onCall({ region: REGION }, async (request) => {
  const uid = requireAdmin(request)
  const { fileName, mimeType, fileSize } = request.data as {
    fileName: string
    mimeType: string
    fileSize: number
  }

  if (!fileName || !fileSize) {
    throw new HttpsError('invalid-argument', 'fileName dan fileSize wajib diisi.')
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw new HttpsError('invalid-argument', 'Ukuran file melebihi batas 200MB.')
  }
  const mimeAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType?.startsWith(prefix))
  if (!mimeAllowed) {
    throw new HttpsError('invalid-argument', 'Tipe file tidak didukung.')
  }

  const storagePath = `documents/${uid}/${randomUUID()}-${fileName}`
  const bucket = storage.bucket()
  const file = bucket.file(storagePath)

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 10 * 60 * 1000, // 10 menit untuk selesai upload
    contentType: mimeType,
  })

  return { uploadUrl, storagePath, token: randomUUID() }
})
