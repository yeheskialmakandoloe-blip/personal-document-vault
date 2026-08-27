import { setGlobalOptions } from 'firebase-functions/v2'

// Batas default supaya biaya & blast radius terkontrol; masing-masing function
// bisa override lewat opsi keduanya sendiri jika perlu.
setGlobalOptions({ maxInstances: 10 })

export { requestUploadUrl } from './handlers/requestUploadUrl'
export { finalizeUpload } from './handlers/finalizeUpload'
export { getFileUrl } from './handlers/getFileUrl'
export { updateDocument, deleteDocument } from './handlers/documentManagement'
export { createVerificationCode, revokeVerificationCode } from './handlers/verificationCodes'
export { redeemVerificationCode } from './handlers/redeemVerificationCode'
export { setAdminClaim } from './handlers/setAdminClaim'
