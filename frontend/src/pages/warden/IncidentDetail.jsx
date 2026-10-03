import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import IncidentTimeline from '../../components/incidents/IncidentTimeline'
import {
  getIncidentDetails,
  updateIncident,
  getMockTimeline,
} from '../../services/incidentService'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
  { to: '/warden/audit-logs', label: 'Audit Logs' },
]

const statusVariant = {
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  RESOLVED: 'success',
}

export default function IncidentDetail() {
  const { id } = useParams()

  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  function load() {
    setLoading(true)
    setError(false)

    getIncidentDetails(id)
      .then(setIncident)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function handleAcknowledge() {
    setUpdating(true)
    setError(false)

    try {
      const updated = await updateIncident(id, {
        status: 'ACKNOWLEDGED',
      })

      setIncident(updated)
    } catch {
      setError(true)
    } finally {
      setUpdating(false)
    }
  }

  async function handleResolve() {
    setUpdating(true)
    setError(false)

    try {
      const updated = await updateIncident(id, {
        status: 'RESOLVED',
        resolutionNote: 'Warden resolved the incident.',
      })

      setIncident(updated)
    } catch {
      setError(true)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-md">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <ErrorState onRetry={load} />
        )}

        {!loading && !error && incident && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-neutral-900">
                  Incident #{incident.id}
                </p>

                <Badge
                  variant={
                    statusVariant[incident.status] ||
                    'neutral'
                  }
                >
                  {incident.status}
                </Badge>
              </div>

              <p className="text-sm text-neutral-600">
                Type
              </p>

              <p className="text-neutral-900 mb-2">
                {incident.type}
              </p>

              <p className="text-sm text-neutral-600">
                Zone
              </p>

              <p className="text-neutral-900 mb-2">
                {incident.zone}
              </p>

              <p className="text-sm text-neutral-600">
                Reported
              </p>

              <p className="text-neutral-900 mb-2">
                {incident.date}
              </p>

              {incident.resident?.name && (
                <>
                  <p className="text-sm text-neutral-600">
                    Resident
                  </p>

                  <p className="text-neutral-900 mb-2">
                    {incident.resident.name}
                  </p>
                </>
              )}

              {incident.backendStatus === 'PENDING' && (
                <Button
                  className="w-full mt-3"
                  onClick={handleAcknowledge}
                  disabled={updating}
                >
                  {updating
                    ? 'Updating...'
                    : 'Acknowledge Incident'}
                </Button>
              )}

              {incident.backendStatus === 'ACKNOWLEDGED' && (
                <Button
                  variant="success"
                  className="w-full mt-3"
                  onClick={handleResolve}
                  disabled={updating}
                >
                  {updating
                    ? 'Updating...'
                    : 'Mark Resolved'}
                </Button>
              )}

              {incident.backendStatus === 'ESCALATED' && (
                <p className="text-danger-600 font-medium mt-4">
                  Escalated to security.
                </p>
              )}
            </Card>

            <Card>
              <p className="font-semibold text-neutral-900 mb-3">
                Timeline
              </p>

              <IncidentTimeline
                events={getMockTimeline(incident)}
              />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}