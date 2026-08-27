import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'

export const app = initializeApp()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const authAdmin = getAuth(app)

export const BUCKET_NAME = process.env.STORAGE_BUCKET // di-set otomatis oleh Firebase runtime
export const REGION = 'asia-southeast2'
