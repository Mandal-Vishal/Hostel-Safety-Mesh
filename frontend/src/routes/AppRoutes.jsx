import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import UIKit from "../pages/UIKit";
import ProtectedRoute from "./ProtectedRoute";

import ResidentDashboard from "../pages/resident/ResidentDashboard";
import WardenDashboard from "../pages/warden/WardenDashboard";
import SecurityDashboard from "../pages/security/SecurityDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";

import CheckIn from "../pages/resident/CheckIn";
import SOS from "../pages/resident/SOS";
import SOSDetail from "../pages/warden/SOSDetail";
import ActiveSOS from "../pages/warden/ActiveSOS";

import Incidents from "../pages/resident/Incidents";
import ReportIncident from "../pages/resident/ReportIncident";

import IncidentDetail from "../pages/resident/IncidentDetail";
import WardenIncidents from "../pages/warden/Incidents";
import WardenIncidentDetail from "../pages/warden/IncidentDetail";

import Devices from "../pages/warden/Devices";
import Notifications from "../pages/resident/Notifications";
import CheckIns from "../pages/warden/CheckIns";
import Analytics from "../pages/warden/Analytics";

import WardenAuditLogs from "../pages/warden/AuditLogs";

import AdminAuditLogs from "../pages/admin/AuditLogs";
import AdminAuditLogDetail from "../pages/admin/AuditLogDetail";

import Users from "../pages/admin/Users";
import Zones from "../pages/admin/Zones";

import Privacy from "../pages/resident/Privacy";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ui-kit" element={<UIKit />} />

      {/* ========================= */}
      {/* RESIDENT */}
      {/* ========================= */}

      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/check-in"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <CheckIn />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/sos"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <SOS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/incidents"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <Incidents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/incidents/report"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <ReportIncident />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <IncidentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/notifications"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/privacy"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <Privacy />
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* WARDEN */}
      {/* ========================= */}

      <Route
        path="/warden/dashboard"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <WardenDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/sos"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <ActiveSOS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/sos/:id"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <SOSDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/incidents"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <WardenIncidents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <WardenIncidentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/devices"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <Devices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/check-ins"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <CheckIns />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/analytics"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warden/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["warden"]}>
            <WardenAuditLogs />
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* SECURITY */}
      {/* ========================= */}

      <Route
        path="/security/dashboard"
        element={
          <ProtectedRoute allowedRoles={["security"]}>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* ADMIN */}
      {/* ========================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAuditLogDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/zones"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Zones />
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* FALLBACK */}
      {/* ========================= */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
