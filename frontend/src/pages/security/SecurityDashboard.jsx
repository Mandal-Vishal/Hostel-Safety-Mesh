import DashboardLayout from '../../components/layout/DashboardLayout'

const sidebarLinks = [
  { to: '/security/dashboard', label: 'Dashboard' },
  { to: '/security/alerts', label: 'Active Alerts' },
  { to: '/security/incidents', label: 'Assigned Incidents' },
]

export default function SecurityDashboard() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900">Security Dashboard</h1>
      <p className="text-neutral-600 mt-2">Placeholder — built in Phase 3.</p>
    </DashboardLayout>
  )
}