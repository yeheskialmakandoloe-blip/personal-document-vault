import { useQuery } from '@tanstack/react-query'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { FileText, KeyRound, Download, Eye } from 'lucide-react'
import { db } from '@/lib/firebase'

async function fetchStats() {
  const documentsRef = collection(db, 'documents')
  const codesRef = collection(db, 'verificationCodes')

  const [totalDocs, publicDocs, activeCodes] = await Promise.all([
    getCountFromServer(documentsRef),
    getCountFromServer(query(documentsRef, where('isPublic', '==', true))),
    getCountFromServer(query(codesRef, where('isRevoked', '==', false))),
  ])

  return {
    totalDocs: totalDocs.data().count,
    publicDocs: publicDocs.data().count,
    activeCodes: activeCodes.data().count,
  }
}

const cards = [
  { key: 'totalDocs' as const, label: 'Total Dokumen', icon: FileText },
  { key: 'publicDocs' as const, label: 'Dokumen Publik', icon: Eye },
  { key: 'activeCodes' as const, label: 'Kode Aktif', icon: KeyRound },
]

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchStats })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-500">Ringkasan aktivitas Document Vault Anda.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-brand-500" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {data?.[key] ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Download className="h-4 w-4" />
          <p className="font-medium">Mulai cepat</p>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-500">
          <li>Buka <strong>Documents</strong> untuk upload file baru.</li>
          <li>Buka <strong>Verification Codes</strong> untuk membuat kode download.</li>
          <li>Pantau <strong>Activity Logs</strong> untuk melihat siapa mengunduh apa.</li>
        </ul>
      </div>
    </div>
  )
}
