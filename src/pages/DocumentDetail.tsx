import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { ArrowLeft, Download, FileWarning, Loader2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { getFileUrl } from '@/lib/api'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { VerificationCodeModal } from '@/components/documents/VerificationCodeModal'
import type { VaultDocument } from '@/types'
import { formatFileSize, isImagePreview, isOfficePreview, isPdfPreview, isTextPreview } from '@/lib/format'

async function fetchDocument(id: string): Promise<VaultDocument | null> {
  const snap = await getDoc(doc(db, 'documents', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as VaultDocument
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const [showCodeModal, setShowCodeModal] = useState(false)

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
  })

  const { data: previewUrl } = useQuery({
    queryKey: ['preview-url', id],
    queryFn: async () => {
      const res = await getFileUrl({ documentId: id!, mode: 'preview' })
      return res.data.url
    },
    enabled: !!document,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat dokumen...
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <FileWarning className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-slate-500">Dokumen tidak ditemukan atau bersifat privat.</p>
          <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
            Kembali ke daftar dokumen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{document.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {document.fileExtension.toUpperCase()} · {formatFileSize(document.fileSize)}
            </p>
          </div>
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            <Download className="h-4 w-4" />
            Download (butuh kode)
          </button>
        </div>

        {document.description && (
          <p className="mt-4 text-slate-600">{document.description}</p>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {!previewUrl && (
            <div className="flex h-96 items-center justify-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menyiapkan preview...
            </div>
          )}

          {previewUrl && isPdfPreview(document.fileExtension) && (
            <iframe src={previewUrl} title={document.title} className="h-[75vh] w-full" />
          )}

          {previewUrl && isImagePreview(document.fileExtension) && (
            <img src={previewUrl} alt={document.title} className="w-full object-contain" />
          )}

          {previewUrl && isTextPreview(document.fileExtension) && (
            <iframe src={previewUrl} title={document.title} className="h-96 w-full" />
          )}

          {previewUrl && isOfficePreview(document.fileExtension) && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
              title={document.title}
              className="h-[75vh] w-full"
            />
          )}

          {previewUrl &&
            !isPdfPreview(document.fileExtension) &&
            !isImagePreview(document.fileExtension) &&
            !isTextPreview(document.fileExtension) &&
            !isOfficePreview(document.fileExtension) && (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
                <FileWarning className="h-8 w-8" />
                <p className="text-sm">
                  Preview belum tersedia untuk format {document.fileExtension.toUpperCase()}.
                  Gunakan kode verifikasi untuk mengunduh file.
                </p>
              </div>
            )}
        </div>
      </main>

      {showCodeModal && (
        <VerificationCodeModal
          documentId={document.id}
          onClose={() => setShowCodeModal(false)}
        />
      )}
    </div>
  )
}
