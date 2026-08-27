import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Upload, Trash2, Eye, EyeOff, Loader2, Pencil } from 'lucide-react'
import { db } from '@/lib/firebase'
import { deleteDocument, updateDocument } from '@/lib/api'
import type { VaultDocument } from '@/types'
import { formatFileSize } from '@/lib/format'
import { UploadDialog } from '@/components/admin/UploadDialog'

async function fetchAllDocuments(): Promise<VaultDocument[]> {
  // Sebagai admin (custom claim), Security Rules mengizinkan baca semua dokumen.
  const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VaultDocument)
}

export default function AdminDocuments() {
  const queryClient = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: fetchAllDocuments,
  })

  async function togglePublic(doc: VaultDocument) {
    setBusyId(doc.id)
    try {
      await updateDocument({ documentId: doc.id, isPublic: !doc.isPublic })
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(doc: VaultDocument) {
    if (!confirm(`Hapus "${doc.title}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setBusyId(doc.id)
    try {
      await deleteDocument({ documentId: doc.id })
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
          <p className="mt-1 text-slate-500">Kelola semua dokumen di vault Anda.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Upload className="h-4 w-4" /> Upload File
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Ukuran</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Downloads</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {documents?.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{doc.title}</td>
                <td className="px-4 py-3 text-slate-500">{doc.category || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatFileSize(doc.fileSize)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      doc.isPublic
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {doc.isPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{doc.downloadCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={doc.isPublic ? 'Jadikan private' : 'Jadikan public'}
                      disabled={busyId === doc.id}
                      onClick={() => togglePublic(doc)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {doc.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      title="Edit"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Hapus"
                      disabled={busyId === doc.id}
                      onClick={() => handleDelete(doc)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" />

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false)
            void queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
          }}
        />
      )}
    </div>
  )
}
