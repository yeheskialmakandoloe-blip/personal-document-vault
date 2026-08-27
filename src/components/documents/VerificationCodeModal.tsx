import { useState } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { redeemVerificationCode } from '@/lib/api'

interface Props {
  documentId: string
  onClose: () => void
}

export function VerificationCodeModal({ documentId, onClose }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      // Validasi SEPENUHNYA terjadi di Cloud Function `redeemVerificationCode`.
      // Client tidak pernah menyimpan atau membandingkan hash kode sendiri.
      const res = await redeemVerificationCode({ documentId, code: code.trim() })
      setStatus('success')
      const link = document.createElement('a')
      link.href = res.data.url
      link.download = res.data.fileName
      link.click()
    } catch (err: unknown) {
      setStatus('error')
      const message =
        err instanceof Error ? err.message : 'Kode tidak valid atau sudah kedaluwarsa.'
      setErrorMessage(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Masukkan Kode Verifikasi</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Kode sekali pakai diberikan oleh admin khusus untuk file ini.
        </p>

        {status === 'success' ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-slate-600">Kode valid. Unduhan dimulai otomatis.</p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: A1B2C3D4"
              maxLength={12}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg font-mono tracking-widest outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />

            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || code.length < 4}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              Verifikasi & Download
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
