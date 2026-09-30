import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import UIKit from '../pages/UIKit'
import ProtectedRoute from './ProtectedRoute'

import ResidentDashboard from '../pages/resident/ResidentDashboard'
import WardenDashboard from '../pages/warden/WardenDashboard'
import SecurityDashboard from '../pages/security/SecurityDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ui-kit" element={<UIKit />} />

      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/dashboard"
        element={
          <ProtectedRoute allowedRoles={['warden']}>
            <WardenDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security/dashboard"
        element={
          <ProtectedRoute allowedRoles={['security']}>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}