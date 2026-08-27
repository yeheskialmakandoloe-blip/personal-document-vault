// Jalankan SEKALI SAJA secara lokal untuk membuat admin pertama, sebelum
// ada admin lain yang bisa memanggil setAdminClaim lewat aplikasi.
//
// Persiapan:
//   1. Buat user lewat Firebase Console > Authentication > Add user
//      (atau daftar dulu lewat halaman /admin/login jika sudah ada UI signup —
//      project ini sengaja TIDAK menyediakan signup publik, user dibuat manual).
//   2. Download service account key: Firebase Console > Project Settings >
//      Service Accounts > Generate new private key. JANGAN commit file ini.
//   3. Jalankan:
//        node scripts/bootstrap-admin.mjs ./serviceAccountKey.json user@email.com
//
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const [, , keyPath, email] = process.argv

if (!keyPath || !email) {
  console.error('Penggunaan: node scripts/bootstrap-admin.mjs <path-service-account.json> <email>')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const user = await auth.getUserByEmail(email)
await auth.setCustomUserClaims(user.uid, { role: 'admin' })

console.log(`✅ ${email} (uid: ${user.uid}) sekarang adalah admin.`)
console.log('User perlu logout & login ulang agar custom claim baru terbaca.')
