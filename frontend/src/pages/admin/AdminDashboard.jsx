import DashboardLayout from '../../components/layout/DashboardLayout'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
      <p className="text-neutral-600 mt-2">Placeholder — built later.</p>
    </DashboardLayout>
  )
}