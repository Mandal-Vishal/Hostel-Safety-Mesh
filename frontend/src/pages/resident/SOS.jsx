import DashboardLayout from '../../components/layout/DashboardLayout'

export default function SOS() {
  return (
    <DashboardLayout mobileLinks={[
      { to: '/resident/dashboard', label: 'Home' },
      { to: '/resident/check-in', label: 'Check-In' },
      { to: '/resident/sos', label: 'SOS' },
      { to: '/resident/incidents', label: 'Incidents' },
    ]}>
      <h1 className="text-xl font-bold text-neutral-900">SOS</h1>
      <p className="text-neutral-600 mt-2">Placeholder — built in Step 8.</p>
    </DashboardLayout>
  )
}