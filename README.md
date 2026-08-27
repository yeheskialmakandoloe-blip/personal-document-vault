# Personal Document Vault

Web app untuk menyimpan & mengelola dokumen pribadi dengan preview di browser dan
sistem download berbasis kode verifikasi sekali pakai untuk pengunjung publik.

**Stack:** React + Vite + TypeScript + Tailwind · Firebase (Auth, Firestore, Storage,
Cloud Functions) · Firebase Hosting.

---

## 0. Prasyarat

- Node.js 20+
- Akun Firebase (gratis, tapi Cloud Functions butuh plan **Blaze** — pay-as-you-go;
  ada free tier bulanan yang cukup besar untuk pemakaian pribadi)
- Firebase CLI: `npm install -g firebase-tools`
- Akun GitHub

---

## 1. Setup Firebase Project

```bash
firebase login
firebase projects:create nama-project-anda   # atau pakai project yang sudah ada
```

Di [Firebase Console](https://console.firebase.google.com/):

1. **Authentication** → Sign-in method → aktifkan **Email/Password**.
   Jangan aktifkan sign-up publik — buat user admin manual di tab **Users**.
2. **Firestore Database** → Create database → mode production, pilih region
   `asia-southeast2` (Jakarta) atau region terdekat Anda.
3. **Storage** → Get started → region sama dengan Firestore.
4. **App Check** (opsional tapi sangat direkomendasikan) → Register app →
   provider **reCAPTCHA v3** → simpan site key untuk `.env.local`.
5. **Project Settings → General → Your apps** → tambah Web App → salin config
   ke `.env.local` (lihat langkah 3).
6. **Project Settings → Service Accounts** → Generate new private key →
   simpan sebagai `serviceAccountKey.json` di root project.
   **File ini sudah ada di `.gitignore` — jangan pernah di-commit.**

---

## 2. Setup Lokal

```bash
# Frontend
npm install

# Functions
cd functions
npm install
cd ..

# Konfigurasi
cp .env.example .env.local        # isi dengan Firebase config Anda
cp .firebaserc.example .firebaserc
# edit .firebaserc: ganti "GANTI-DENGAN-PROJECT-ID-FIREBASE-ANDA" dengan project ID asli
```

---

## 3. Buat Admin Pertama

Karena tidak ada halaman signup publik (by design — ini vault pribadi Anda):

1. Firebase Console → Authentication → Add user → masukkan email & password Anda.
2. Jalankan script bootstrap sekali saja:

```bash
node scripts/bootstrap-admin.mjs ./serviceAccountKey.json email-anda@contoh.com
```

Setelah ini, login di `/admin/login` dengan akun tersebut.

---

## 4. Development Lokal (dengan Emulator)

Emulator menjalankan seluruh backend (Auth, Firestore, Storage, Functions) di
komputer Anda — aman untuk eksperimen tanpa menyentuh data production.

```bash
# Terminal 1 — backend emulator
npm run emulators

# Terminal 2 — frontend
# set VITE_USE_EMULATORS=true di .env.local dulu
npm run dev
```

Buka `http://localhost:5173`. Emulator UI (lihat data Firestore/Storage) di
`http://localhost:4000`.

> Catatan: user admin yang dibuat lewat bootstrap script di atas ada di
> project **production** Anda, bukan di emulator. Untuk testing di emulator,
> buat user & set custom claim lewat Emulator UI, atau jalankan bootstrap
> script mengarah ke `http://localhost:9099` (lihat dokumentasi Firebase
> Admin SDK + emulator jika ingin skenario ini).

---

## 5. Deploy ke Production

```bash
# Deploy Security Rules + Indexes
firebase deploy --only firestore:rules,firestore:indexes,storage

# Deploy Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# Build & deploy frontend
npm run build
firebase deploy --only hosting
```

Atau sekaligus: `npm run deploy` (lihat script di `package.json`).

Setelah deploy pertama, aktifkan **App Check enforcement** untuk Functions di
Firebase Console → App Check → APIs, supaya request tanpa token App Check
ditolak di level infrastruktur.

---

## 6. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Personal Document Vault"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

**Sebelum push, pastikan:**
- `.env.local` dan `serviceAccountKey.json` **tidak** ikut ter-commit
  (`git status` seharusnya tidak menampilkan keduanya — sudah ada di
  `.gitignore`).
- `.firebaserc` berisi project ID asli Anda — kalau repo akan **publik**,
  pertimbangkan menambahkan `.firebaserc` ke `.gitignore` juga dan biarkan
  orang lain membuat sendiri dari `.firebaserc.example` (project ID bukan
  secret, tapi tidak perlu dipublikasikan kalau tidak mau).

Kalau ingin auto-deploy setiap push, tambahkan GitHub Actions:
```bash
firebase init hosting:github
```
Perintah ini akan membuat workflow `.github/workflows/` dan meminta Anda
mengizinkan GitHub App Firebase mengakses repo — token yang dihasilkan
otomatis disimpan sebagai **GitHub Secret**, bukan di kode.

---

## Struktur Folder

```
├── src/                    # Frontend React
│   ├── components/
│   │   ├── admin/          # UploadDialog, dll
│   │   ├── documents/      # VerificationCodeModal, dll
│   │   ├── layout/          # AdminSidebar, ProtectedRoute, dll
│   │   └── ui/
│   ├── contexts/           # AuthContext
│   ├── lib/                 # firebase.ts, api.ts (callable wrappers), format.ts
│   ├── pages/               # 1 file per halaman
│   └── types/
├── functions/               # Cloud Functions (backend)
│   └── src/
│       ├── handlers/        # 1 file per operasi (upload, code, dsb)
│       └── utils/           # crypto, rate limit, helpers
├── scripts/
│   └── bootstrap-admin.mjs  # buat admin pertama
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── firebase.json
```

## Status Pengembangan

Fungsional dan aman untuk dipakai (bukan prototype), dengan catatan berikut
sebagai langkah lanjutan yang direkomendasikan sebelum benar-benar production:

- [ ] Uji end-to-end alur upload → generate kode → redeem → download
- [ ] Setup App Check enforcement (langkah 5 di atas)
- [ ] Tambahkan pagination di Activity Logs & Documents jika data sudah banyak
- [ ] Tambahkan halaman edit dokumen (tombol Edit di Documents saat ini placeholder)
- [ ] Uji preview DOC/DOCX/XLS/XLSX/PPT/PPTX (memakai Office Online embed —
      butuh file bisa diakses via signed URL publik-sementara; untuk dokumen
      privat viewer ini bisa gagal karena Microsoft perlu mengambil file itu
      sendiri — pertimbangkan fallback "download untuk lihat" bila ini terjadi)
- [ ] Review ulang MAX_FILE_SIZE dan kuota Storage sesuai kebutuhan Anda
