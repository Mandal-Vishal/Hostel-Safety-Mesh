import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import ActiveSOSCard from '../../components/dashboard/ActiveSOSCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getStats } from '../../services/wardenService'
import { getAllActiveSOS } from '../../services/sosService'
import { useSocketEvent } from '../../hooks/useSocket'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
  { to: '/warden/audit-logs', label: 'Audit Logs' },
]

export default function WardenDashboard() {
  const [stats, setStats] = useState(null)
  const [activeSOS, setActiveSOS] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // live update: when any SOS changes status, refresh the active list
  useSocketEvent('sos:acknowledged', () => {
    getAllActiveSOS().then(setActiveSOS)
  })

  // live update: when an SOS escalates, refresh the active list
  useSocketEvent('sos:escalated', () => {
    getAllActiveSOS().then(setActiveSOS)
  })

  function loadData() {
    setLoading(true)
    setError(false)
    Promise.all([getStats(), getAllActiveSOS()])
      .then(([statsData, sosData]) => {
        setStats(statsData)
        setActiveSOS(sosData)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-xl font-bold text-neutral-900">Warden Dashboard</h1>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadData} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Active SOS" value={stats.activeSOS} accent="danger" />
              <StatCard label="Check-ins" value={stats.checkIns} />
              <StatCard label="Incidents" value={stats.incidents} />
              <StatCard label="Avg Response" value={stats.avgResponse} />
            </div>

            <div>
              <h2 className="font-semibold text-neutral-900 mb-3">Active SOS</h2>
              {activeSOS.length === 0 ? (
                <EmptyState
                  title="No active SOS alerts."
                  description="Everything is currently under control."
                />
              ) : (
                <div className="space-y-3">
                  {activeSOS.map((sos) => (
                    <ActiveSOSCard key={sos.id} sos={sos} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}