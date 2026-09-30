import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import CheckInCard from '../../components/checkin/CheckInCard'
import SOSButton from '../../components/sos/SOSButton'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { useAuth } from '../../hooks/useAuth'
import { getCurrentStatus } from '../../services/checkInService'
import { mockActivity } from '../../mock/activity'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  function loadStatus() {
    setLoading(true)
    setError(false)
    getCurrentStatus()
      .then(setStatus)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Good evening, {user?.name}
          </h1>
          <p className="text-neutral-600 text-sm">
            {user?.hostel} • Room {user?.room}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {error && <ErrorState onRetry={loadStatus} />}

        {!loading && !error && status && <CheckInCard status={status} />}

        <SOSButton />

        <ActivityFeed items={mockActivity} />
      </div>
    </DashboardLayout>
  )
}