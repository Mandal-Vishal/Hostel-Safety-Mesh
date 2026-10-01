import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ActiveSOSCard from '../../components/dashboard/ActiveSOSCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getAllActiveSOS } from '../../services/sosService'
import { useSocketEvent } from '../../hooks/useSocket'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

export default function ActiveSOS() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadList()
  }, [])

  useSocketEvent('sos:acknowledged', () => loadList())

  function loadList() {
    setLoading(true)
    setError(false)
    getAllActiveSOS()
      .then(setList)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Active SOS</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={loadList} />}

      {!loading && !error && list.length === 0 && (
        <EmptyState title="No active SOS alerts." description="Everything is currently under control." />
      )}

      {!loading && !error && list.length > 0 && (
        <div className="space-y-3 max-w-md">
          {list.map((sos) => (
            <ActiveSOSCard key={sos.id} sos={sos} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}