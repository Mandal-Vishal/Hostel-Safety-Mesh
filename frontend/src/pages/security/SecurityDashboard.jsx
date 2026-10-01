import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { getAllActiveSOS, updateSOSStatus } from '../../services/sosService'
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
  const navigate = useNavigate()

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

  async function handleAction(sos, newStatus) {
    setActingId(sos.id)
    try {
      await updateSOSStatus(sos.id, newStatus)
    } catch {
      setError(true)
    } finally {
      setActingId(null)
    }
  }

  // only show alerts the warden has already acknowledged — security responds after that
  const relevant = list.filter((s) => s.status !== 'TRIGGERED' && s.status !== 'RESOLVED')

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Security Dashboard</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={loadList} />}

      {!loading && !error && relevant.length === 0 && (
        <EmptyState title="No active response needed." description="You'll see alerts here once a warden acknowledges an SOS." />
      )}

      {!loading && !error && relevant.length > 0 && (
        <div className="space-y-3 max-w-md">
          {relevant.map((sos) => (
            <Card key={sos.id} className="border-l-4 border-danger-600">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="danger">🔴 SOS</Badge>
                <span className="text-xs text-neutral-600">{sos.triggeredAt}</span>
              </div>
              <p className="text-sm text-neutral-900">{sos.zone}</p>
              <p className="text-sm text-neutral-600 mt-1">
                Warden: {sos.status === 'ACKNOWLEDGED' ? 'Acknowledged' : sos.status.replace('_', ' ')}
              </p>

              {sos.status === 'ACKNOWLEDGED' && (
                <Button
                  className="w-full mt-3"
                  onClick={() => handleAction(sos, 'RESPONDING')}
                  disabled={actingId === sos.id}
                >
                  {actingId === sos.id ? 'Accepting...' : 'Accept Response'}
                </Button>
              )}

              {sos.status === 'RESPONDING' && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium text-neutral-900">Incident #{sos.id}</p>
                  <Button
                    className="w-full"
                    onClick={() => handleAction(sos, 'ON_SCENE')}
                    disabled={actingId === sos.id}
                  >
                    Mark On Scene
                  </Button>
                </div>
              )}

              {sos.status === 'ON_SCENE' && (
                <Button
                  variant="success"
                  className="w-full mt-3"
                  onClick={() => handleAction(sos, 'RESOLVED')}
                  disabled={actingId === sos.id}
                >
                  Resolve Incident
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}