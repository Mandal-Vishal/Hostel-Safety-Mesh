import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getAdminStats } from '../../services/adminService'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Admin Dashboard</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
          <StatCard label="Users" value={stats.totalUsers} />
          <StatCard label="Residents" value={stats.residents} />
          <StatCard label="Wardens" value={stats.wardens} />
          <StatCard label="Security Staff" value={stats.securityStaff} />
          <StatCard label="Active Devices" value={stats.activeDevices} />
          <StatCard label="Online Devices" value={stats.onlineDevices} />
          <StatCard label="Incidents This Month" value={stats.incidentsThisMonth} />
          <StatCard label="SOS Events" value={stats.sosEvents} accent="danger" />
        </div>
      )}
    </DashboardLayout>
  )
}