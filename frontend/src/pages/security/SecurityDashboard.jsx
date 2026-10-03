import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import {
  getAllActiveSOS,
  updateSOSStatus,
} from '../../services/sosService'
import { useSocketEvent } from '../../hooks/useSocket'

const sidebarLinks = [
  { to: '/security/dashboard', label: 'Dashboard' },
  { to: '/security/alerts', label: 'Active Alerts' },
  { to: '/security/incidents', label: 'Assigned Incidents' },
]

export default function SecurityDashboard() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    loadList()
  }, [])

  useSocketEvent('incident:assigned', () => {
    loadList()
  })

  useSocketEvent('incident:escalated', () => {
    loadList()
  })

  useSocketEvent('incident:resolved', () => {
    loadList()
  })

  function loadList() {
    setLoading(true)
    setError(false)

    getAllActiveSOS()
      .then(setList)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function handleResolve(sos) {
    setActingId(sos.id)
    setError(false)

    try {
      await updateSOSStatus(sos.id, 'RESOLVED', {
        resolutionNote: 'Security response completed.',
      })

      await loadList()
    } catch {
      setError(true)
    } finally {
      setActingId(null)
    }
  }

  const relevant = list.filter(
    (sos) => sos.status === 'ESCALATED',
  )

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">
        Security Dashboard
      </h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <ErrorState onRetry={loadList} />
      )}

      {!loading && !error && relevant.length === 0 && (
        <EmptyState
          title="No escalated incidents."
          description="Escalated SOS incidents assigned to security will appear here."
        />
      )}

      {!loading && !error && relevant.length > 0 && (
        <div className="space-y-3 max-w-md">
          {relevant.map((sos) => (
            <Card
              key={sos.id}
              className="border-l-4 border-danger-600"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="danger">
                  ESCALATED SOS
                </Badge>

                <span className="text-xs text-neutral-600">
                  {sos.triggeredAt}
                </span>
              </div>

              <p className="text-sm text-neutral-900">
                {sos.zone}
              </p>

              <p className="text-sm text-neutral-600 mt-1">
                Security assignment: active
              </p>

              {sos.escalationReason && (
                <p className="text-sm text-neutral-600 mt-2">
                  Reason: {sos.escalationReason}
                </p>
              )}

              <Button
                variant="success"
                className="w-full mt-3"
                onClick={() => handleResolve(sos)}
                disabled={actingId === sos.id}
              >
                {actingId === sos.id
                  ? 'Resolving...'
                  : 'Resolve Incident'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}