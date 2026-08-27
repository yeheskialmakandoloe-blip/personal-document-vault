import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  KeyRound,
  ScrollText,
  Settings,
  LogOut,
  Vault,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/documents', label: 'Documents', icon: FileText },
  { to: '/admin/codes', label: 'Verification Codes', icon: KeyRound },
  { to: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <Vault className="h-6 w-6 text-brand-600" />
        <span className="text-lg font-semibold">Document Vault</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-sm font-medium text-slate-700">{user?.displayName}</p>
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
        <button
          onClick={() => void signOut()}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
