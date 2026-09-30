import DashboardLayout from '../../components/layout/DashboardLayout'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function ResidentDashboard() {
  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <h1 className="text-xl font-bold text-neutral-900">Resident Dashboard</h1>
      <p className="text-neutral-600 mt-2">Placeholder — built in Step 6.</p>
    </DashboardLayout>
  )
}