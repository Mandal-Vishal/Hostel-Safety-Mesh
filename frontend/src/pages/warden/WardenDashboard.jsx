import DashboardLayout from '../../components/layout/DashboardLayout'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

export default function WardenDashboard() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900">Warden Dashboard</h1>
      <p className="text-neutral-600 mt-2">Placeholder — built in Phase 3.</p>
    </DashboardLayout>
  )
}