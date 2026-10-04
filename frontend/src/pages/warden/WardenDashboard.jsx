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

  useSocketEvent('sos:acknowledged', () => {
    getAllActiveSOS().then(setActiveSOS)
  })

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
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Warden Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Monitor hostel safety, SOS alerts and resident activity.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <div className="max-w-xl">
            <ErrorState onRetry={loadData} />
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Active SOS"
                value={stats.activeSOS}
                accent="danger"
              />
              <StatCard
                label="Check-ins"
                value={stats.checkIns}
              />
              <StatCard
                label="Incidents"
                value={stats.incidents}
              />
              <StatCard
                label="Avg Response"
                value={stats.avgResponse}
              />
            </div>

            {/* Active SOS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Active SOS
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Live emergency alerts requiring attention.
                  </p>
                </div>

                {activeSOS.length > 0 && (
                  <span className="text-sm font-medium text-danger-600">
                    {activeSOS.length} active
                  </span>
                )}
              </div>

              {activeSOS.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl p-2">
                  <EmptyState
                    title="No active SOS alerts."
                    description="Everything is currently under control."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {activeSOS.map((sos) => (
                    <ActiveSOSCard key={sos.id} sos={sos} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}