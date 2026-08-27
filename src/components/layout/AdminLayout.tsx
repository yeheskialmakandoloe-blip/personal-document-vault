import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  )
}
