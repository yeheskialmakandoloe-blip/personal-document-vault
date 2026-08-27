import { useState } from 'react'
import { X, Loader2, UploadCloud } from 'lucide-react'
import { finalizeUpload, requestUploadUrl } from '@/lib/api'

interface Props {
  onClose: () => void
  onUploaded: () => void
}

export function UploadDialog({ onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setStatus('uploading')
    setError('')

    try {
      // 1) Minta signed upload URL dari Cloud Function (admin-only, dicek server-side).
      const { data: uploadInfo } = await requestUploadUrl({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      })

      // 2) Upload langsung ke Storage lewat signed URL (tidak lewat server kita,
      //    jadi tidak membebani Cloud Function dengan payload besar).
      await fetch(uploadInfo.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      // 3) Finalisasi: catat metadata ke Firestore setelah file benar-benar ada di Storage.
      await finalizeUpload({
        storagePath: uploadInfo.storagePath,
        title: title || file.name,
        description,
        category,
        isPublic,
      })

      onUploaded()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload gagal, coba lagi.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Upload File</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-6 text-sm text-slate-500 hover:border-brand-300">
            <UploadCloud className="h-6 w-6" />
            {file ? file.name : 'Pilih file (PDF, Word, Excel, DWG, SKP, PPT, JPG, PNG, ZIP...)'}
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <input
            placeholder="Judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            placeholder="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <input
            placeholder="Kategori (mis. Legal, Desain, Sertifikat)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Tampilkan sebagai dokumen publik
          </label>

          {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!file || status === 'uploading'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
            Upload
          </button>
        </form>
      </div>
    </div>
  )
}
