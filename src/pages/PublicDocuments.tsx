import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { FileIcon, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { db } from '@/lib/firebase'
import { PublicHeader } from '@/components/layout/PublicHeader'
import type { VaultDocument } from '@/types'
import { formatFileSize } from '@/lib/format'

async function fetchPublicDocuments(): Promise<VaultDocument[]> {
  // Security Rules hanya mengizinkan baca dokumen dengan isPublic == true untuk
  // request tanpa auth — lihat firestore.rules.
  const q = query(
    collection(db, 'documents'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VaultDocument)
}

export default function PublicDocuments() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: documents, isLoading } = useQuery({
    queryKey: ['public-documents'],
    queryFn: fetchPublicDocuments,
  })

  const filtered = useMemo(() => {
    if (!documents) return []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return documents
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term),
    )
  }, [documents, searchTerm])

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dokumen Publik</h1>
        <p className="mt-1 text-slate-500">
          Jelajahi dokumen yang tersedia. Preview gratis — download memerlukan kode
          verifikasi dari admin.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full text-sm outline-none placeholder:text-slate-400"
            placeholder="Cari judul atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <p className="mt-10 text-center text-slate-400">Memuat dokumen...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className="mt-10 text-center text-slate-400">Belum ada dokumen yang tersedia.</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 group-hover:text-brand-700">
                    {doc.title}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {doc.fileExtension} · {formatFileSize(doc.fileSize)}
                  </p>
                </div>
              </div>
              {doc.description && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{doc.description}</p>
              )}
              <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                {doc.category || 'Umum'}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
