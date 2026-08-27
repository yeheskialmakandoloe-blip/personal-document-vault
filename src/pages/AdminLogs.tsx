import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActivityLog } from '@/types'
import { formatDate } from '@/lib/format'

async function fetchLogs(): Promise<ActivityLog[]> {
  const snap = await getDocs(
    query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(100)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog)
}

const typeLabels: Record<ActivityLog['type'], string> = {
  upload: 'Upload file',
  edit: 'Edit dokumen',
  delete: 'Hapus dokumen',
  code_created: 'Buat kode',
  code_revoked: 'Cabut kode',
  code_redeemed: 'Kode berhasil dipakai',
  code_failed: 'Percobaan kode gagal',
  admin_login: 'Login admin',
  download: 'Download file',
}

const typeColor: Record<ActivityLog['type'], string> = {
  upload: 'bg-blue-50 text-blue-700',
  edit: 'bg-amber-50 text-amber-700',
  delete: 'bg-red-50 text-red-700',
  code_created: 'bg-emerald-50 text-emerald-700',
  code_revoked: 'bg-slate-100 text-slate-500',
  code_redeemed: 'bg-emerald-50 text-emerald-700',
  code_failed: 'bg-red-50 text-red-700',
  admin_login: 'bg-slate-100 text-slate-500',
  download: 'bg-blue-50 text-blue-700',
}

export default function AdminLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ['admin-logs'], queryFn: fetchLogs })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Activity Logs</h1>
      <p className="mt-1 text-slate-500">100 aktivitas terbaru di seluruh vault.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Aktivitas</th>
              <th className="px-4 py-3 font-medium">Dokumen</th>
              <th className="px-4 py-3 font-medium">Aktor</th>
              <th className="px-4 py-3 font-medium">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeColor[log.type]}`}>
                    {typeLabels[log.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{log.documentTitle ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {log.actorType === 'admin' ? 'Admin' : 'Public'}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
