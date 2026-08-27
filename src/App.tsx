import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'

import PublicDocuments from '@/pages/PublicDocuments'
import DocumentDetail from '@/pages/DocumentDetail'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminDocuments from '@/pages/AdminDocuments'
import AdminCodes from '@/pages/AdminCodes'
import AdminLogs from '@/pages/AdminLogs'
import AdminSettings from '@/pages/AdminSettings'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicDocuments />} />
      <Route path="/documents/:id" element={<DocumentDetail />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin (dilindungi ProtectedRoute — cek custom claim role=admin) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="/admin/codes" element={<AdminCodes />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}
