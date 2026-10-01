import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import SOSTimeline from '../../components/sos/SOSTimeline'
import { getSOSDetails, acknowledgeSOS, _devAdvanceStatus } from '../../services/sosService'
import { useSocketEvent } from '../../hooks/useSocket'
import { SOS_STATUSES } from '../../utils/sosStatus'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

export default function SOSDetail() {
  const { id } = useParams()
  const [sos, setSos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    loadDetails()
  }, [id])

  useSocketEvent('sos:acknowledged', (updated) => {
    setSos(updated)
  })

  useSocketEvent('sos:escalated', (updated) => {
    setSos(updated)
  })

  function loadDetails() {
    setLoading(true)
    setError(false)
    getSOSDetails(id)
      .then(setSos)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function handleAcknowledge() {
    setAcknowledging(true)
    try {
      await acknowledgeSOS(id)
      // sos state updates via the socket event listener above
    } catch {
      setError(true)
    } finally {
      setAcknowledging(false)
    }
  }

  // dev helper to keep testing further statuses, same as the resident page
  function advanceStatus() {
    const currentIndex = SOS_STATUSES.indexOf(sos.status)
    const next = SOS_STATUSES[currentIndex + 1]
    if (next) _devAdvanceStatus(next)
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-md">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">SOS Incident</h1>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadDetails} />}

        {!loading && !error && sos && (
          <div className="space-y-4">
            <Card>
              {sos.escalated && (
                <div className="bg-danger-50 border border-danger-500 rounded-lg p-3 mb-3">
                  <p className="text-danger-600 font-semibold text-sm">⚠ SOS ESCALATED</p>
                  <p className="text-danger-600 text-xs mt-1">
                    No acknowledgement received within the configured response window.
                  </p>
                </div>
              )}

              <p className="text-sm text-neutral-600">Status</p>
              <p className="font-bold text-danger-600">{sos.status}</p>

              <p className="text-sm text-neutral-600 mt-3">Resident</p>
              <p className="text-neutral-900">R••••••••</p>

              <p className="text-sm text-neutral-600 mt-3">Zone</p>
              <p className="text-neutral-900">{sos.zone}</p>

              <p className="text-sm text-neutral-600 mt-3">Triggered</p>
              <p className="text-neutral-900">{sos.triggeredAt}</p>

              {sos.status === 'TRIGGERED' && (
                <Button className="w-full mt-4" onClick={handleAcknowledge} disabled={acknowledging}>
                  {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}

              {sos.status !== 'TRIGGERED' && (
                <p className="text-success-600 font-medium mt-4">✓ ACKNOWLEDGED</p>
              )}
            </Card>

            <Card>
              <p className="font-semibold text-neutral-900 mb-4">Timeline</p>
              <SOSTimeline currentStatus={sos.status} />
              {sos.status !== 'RESOLVED' && (
                <button
                  onClick={advanceStatus}
                  className="mt-2 text-xs text-neutral-600 underline block mx-auto"
                >
                  [DEV] Advance status →
                </button>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}