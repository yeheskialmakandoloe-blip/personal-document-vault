import { useState } from 'react'
import { updatePassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminSettings() {
  const { user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!auth.currentUser || newPassword.length < 8) return
    setStatus('saving')
    try {
      await updatePassword(auth.currentUser, newPassword)
      setStatus('saved')
      setNewPassword('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">Kelola akun admin Anda.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-800">Akun</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-800">Ganti Password</h2>
        <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
          <input
            type="password"
            placeholder="Password baru (min. 8 karakter)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={status === 'saving' || newPassword.length < 8}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Simpan
          </button>
          {status === 'saved' && (
            <p className="text-sm text-emerald-600">Password berhasil diperbarui.</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600">
              Gagal memperbarui. Coba login ulang lalu ulangi.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
