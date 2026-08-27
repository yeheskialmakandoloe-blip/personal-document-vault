import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Ban, Copy, KeyRound, Loader2, X } from 'lucide-react'
import { db } from '@/lib/firebase'
import { createVerificationCode, revokeVerificationCode } from '@/lib/api'
import type { VaultDocument, VerificationCodeSummary } from '@/types'
import { formatDate } from '@/lib/format'

async function fetchDocuments(): Promise<VaultDocument[]> {
  const snap = await getDocs(query(collection(db, 'documents'), orderBy('title')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VaultDocument)
}

async function fetchCodes(): Promise<VerificationCodeSummary[]> {
  // Catatan: field codeHash TIDAK termasuk dalam dokumen yang dikembalikan ke client
  // di implementasi Cloud Function-nya — hanya ringkasan aman yang disimpan/dibaca.
  const snap = await getDocs(query(collection(db, 'verificationCodes'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VerificationCodeSummary)
}

export default function AdminCodes() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)

  const { data: documents } = useQuery({ queryKey: ['admin-documents-list'], queryFn: fetchDocuments })
  const { data: codes, isLoading } = useQuery({ queryKey: ['admin-codes'], queryFn: fetchCodes })

  async function handleRevoke(codeId: string) {
    if (!confirm('Cabut kode ini? Kode tidak akan bisa dipakai lagi.')) return
    await revokeVerificationCode({ codeId })
    await queryClient.invalidateQueries({ queryKey: ['admin-codes'] })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Verification Codes</h1>
          <p className="mt-1 text-slate-500">Buat dan kelola kode download sekali pakai.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <KeyRound className="h-4 w-4" /> Buat Kode
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Dokumen</th>
              <th className="px-4 py-3 font-medium">Penggunaan</th>
              <th className="px-4 py-3 font-medium">Kedaluwarsa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {codes?.map((c) => {
              const expired = c.isExpired || c.expiresAt < Date.now()
              const usedUp = c.usedCount >= c.maxUses
              const inactive = c.isRevoked || expired || usedUp
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.documentTitle}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.usedCount} / {c.maxUses}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        inactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {c.isRevoked ? 'Dicabut' : expired ? 'Kedaluwarsa' : usedUp ? 'Habis' : 'Aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!inactive && (
                      <button
                        title="Cabut kode"
                        onClick={() => handleRevoke(c.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateCodeDialog
          documents={documents ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={(code) => {
            setNewCode(code)
            setShowCreate(false)
            void queryClient.invalidateQueries({ queryKey: ['admin-codes'] })
          }}
        />
      )}

      {newCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Kode Dibuat</h2>
            <p className="mt-1 text-sm text-slate-500">
              Salin kode ini sekarang — kode plaintext tidak akan ditampilkan lagi.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-3 font-mono text-2xl tracking-widest text-slate-800">
              {newCode}
              <button
                onClick={() => navigator.clipboard.writeText(newCode)}
                className="text-slate-400 hover:text-slate-700"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setNewCode(null)}
              className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateCodeDialog({
  documents,
  onClose,
  onCreated,
}: {
  documents: VaultDocument[]
  onClose: () => void
  onCreated: (code: string) => void
}) {
  const [documentId, setDocumentId] = useState(documents[0]?.id ?? '')
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [maxUses, setMaxUses] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createVerificationCode({ documentId, expiresInHours, maxUses })
      onCreated(res.data.plaintextCode)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Buat Kode Verifikasi</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          <div>
            <label className="text-xs font-medium text-slate-500">Masa berlaku (jam)</label>
            <input
              type="number"
              min={1}
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Jumlah penggunaan maksimal</label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={!documentId || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Buat Kode
          </button>
        </form>
      </div>
    </div>
  )
}
