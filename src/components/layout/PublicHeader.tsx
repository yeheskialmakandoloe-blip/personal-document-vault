import { Link } from 'react-router-dom'
import { Vault } from 'lucide-react'

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Vault className="h-6 w-6 text-brand-600" />
          <span className="text-lg font-semibold text-slate-900">Document Vault</span>
        </Link>
        <Link
          to="/admin/login"
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Admin
        </Link>
      </div>
    </header>
  )
}
