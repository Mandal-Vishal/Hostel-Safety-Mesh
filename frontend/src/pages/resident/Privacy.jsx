import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function Privacy() {
  const { user } = useAuth()

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-bold text-neutral-900">Privacy Center</h1>

        <Card>
          <p className="font-semibold text-neutral-900 mb-2">Your location information</p>
          <p className="text-sm text-neutral-600">
            The system uses zone-level information instead of continuously tracking your precise location.
          </p>
        </Card>

        <Card>
          <p className="font-semibold text-neutral-900 mb-3">Information currently associated with you</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Hostel</span>
              <span className="text-neutral-900 font-medium">{user?.hostel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Room</span>
              <span className="text-neutral-900 font-medium">{user?.room}</span>
            </div>
          </div>
          <div className="border-t border-neutral-200 mt-3 pt-3">
            <p className="text-sm text-neutral-600">Location tracking</p>
            <p className="text-success-600 font-medium text-sm mt-1">Not continuously active</p>
          </div>
        </Card>

        <Card>
          <p className="font-semibold text-neutral-900 mb-2">Emergency Information</p>
          <p className="text-sm text-neutral-600">
            During an SOS event, authorized safety staff may receive your relevant zone information.
          </p>
          <button className="text-primary-700 text-sm font-medium mt-3 hover:underline">
            View Data Policy
          </button>
        </Card>
      </div>
    </DashboardLayout>
  )
}