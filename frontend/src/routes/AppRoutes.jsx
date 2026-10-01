import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import UIKit from '../pages/UIKit'
import ProtectedRoute from './ProtectedRoute'

import ResidentDashboard from '../pages/resident/ResidentDashboard'
import WardenDashboard from '../pages/warden/WardenDashboard'
import SecurityDashboard from '../pages/security/SecurityDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'

import CheckIn from '../pages/resident/CheckIn'
import SOS from '../pages/resident/SOS'
import SOSDetail from '../pages/warden/SOSDetail'
import ActiveSOS from '../pages/warden/ActiveSOS'

import Incidents from '../pages/resident/Incidents'
import ReportIncident from '../pages/resident/ReportIncident'

import IncidentDetail from '../pages/resident/IncidentDetail'
import WardenIncidents from '../pages/warden/Incidents'
import WardenIncidentDetail from '../pages/warden/IncidentDetail'

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
        path="/resident/check-in"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <CheckIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/sos"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <SOS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/incidents"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Incidents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/incidents/report"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ReportIncident />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <IncidentDetail />
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
          path="/warden/sos"
          element={
            <ProtectedRoute allowedRoles={['warden']}>
              <ActiveSOS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/sos/:id"
          element={
            <ProtectedRoute allowedRoles={['warden']}>
              <SOSDetail />
            </ProtectedRoute>
          }
        />

      <Route
        path="/warden/incidents"
        element={
          <ProtectedRoute allowedRoles={['warden']}>
            <WardenIncidents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warden/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={['warden']}>
            <WardenIncidentDetail />
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