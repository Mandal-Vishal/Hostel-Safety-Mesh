import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import IncidentTimeline from '../../components/incidents/IncidentTimeline'
import { getIncidentDetails, getMockTimeline } from '../../services/incidentService'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

const statusVariant = { OPEN: 'danger', INVESTIGATING: 'warning', RESOLVED: 'success' }

export default function IncidentDetail() {
  const { id } = useParams()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    getIncidentDetails(id)
      .then(setIncident)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState />}

        {!loading && !error && incident && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-neutral-900">{incident.id}</p>
                <Badge variant={statusVariant[incident.status] || 'neutral'}>{incident.status}</Badge>
              </div>
              <p className="text-sm text-neutral-600">Type</p>
              <p className="text-neutral-900 mb-2">{incident.type}</p>
              <p className="text-sm text-neutral-600">Zone</p>
              <p className="text-neutral-900 mb-2">{incident.zone}</p>
              <p className="text-sm text-neutral-600">Reported</p>
              <p className="text-neutral-900 mb-2">{incident.date}</p>
              {incident.description && (
                <>
                  <p className="text-sm text-neutral-600">Description</p>
                  <p className="text-neutral-900">{incident.description}</p>
                </>
              )}
            </Card>

            <Card>
              <p className="font-semibold text-neutral-900 mb-3">Timeline</p>
              <IncidentTimeline events={getMockTimeline(incident)} />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}