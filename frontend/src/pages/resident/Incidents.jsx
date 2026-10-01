import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function Incidents() {
  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-neutral-900">My Reports</h1>
        <Link to="/resident/incidents/report">
          <Button>Report Incident</Button>
        </Link>
      </div>
      <p className="text-neutral-600">Placeholder — full list built in Step 16.</p>
    </DashboardLayout>
  )
}