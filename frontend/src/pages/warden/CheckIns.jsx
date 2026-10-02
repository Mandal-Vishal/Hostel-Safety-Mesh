import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getPendingSummary, getPendingResidents } from '../../services/checkInService'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

export default function CheckIns() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expandedZone, setExpandedZone] = useState(null)
  const [pendingList, setPendingList] = useState([])

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    setError(false)
    getPendingSummary()
      .then(setSummary)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function toggleZone(zone) {
    if (expandedZone === zone) {
      setExpandedZone(null)
      return
    }
    const residents = await getPendingResidents(zone)
    setPendingList(residents)
    setExpandedZone(zone)
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Pending Check-Ins</h1>
      <p className="text-sm text-neutral-600 mb-4">Tonight</p>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-3 max-w-md">
          {summary.map((z) => (
            <Card key={z.zone}>
              <p className="font-semibold text-neutral-900">{z.zone}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-neutral-600 text-xs">Expected</p>
                  <p className="font-medium text-neutral-900">{z.expected}</p>
                </div>
                <div>
                  <p className="text-neutral-600 text-xs">Checked In</p>
                  <p className="font-medium text-success-600">{z.checkedIn}</p>
                </div>
                <div>
                  <p className="text-neutral-600 text-xs">Pending</p>
                  <p className="font-medium text-danger-600">{z.pending}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-3" onClick={() => toggleZone(z.zone)}>
                {expandedZone === z.zone ? 'Hide Pending' : 'View Pending'}
              </Button>

              {expandedZone === z.zone && (
                <div className="mt-3 border-t border-neutral-200 pt-3 space-y-2">
                  {pendingList.length === 0 ? (
                    <p className="text-sm text-neutral-600">No pending residents.</p>
                  ) : (
                    pendingList.map((r) => (
                      <div key={r.id} className="flex justify-between text-sm">
                        <span className="text-neutral-900">{r.id}</span>
                        <span className="text-neutral-600">{r.zone}</span>
                        <span className="text-danger-600 font-medium">{r.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}