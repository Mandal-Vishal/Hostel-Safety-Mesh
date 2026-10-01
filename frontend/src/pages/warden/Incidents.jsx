import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { getIncidents } from '../../services/incidentService'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

const filters = ['All', 'Open', 'Investigating', 'Resolved']
const statusVariant = { OPEN: 'danger', INVESTIGATING: 'warning', RESOLVED: 'success' }

export default function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    getIncidents()
      .then(setIncidents)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All'
    ? incidents
    : incidents.filter((i) => i.status === filter.toUpperCase())

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Incident Reports</h1>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No incidents found." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3 max-w-md">
          {filtered.map((inc) => (
            <Card key={inc.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-neutral-900">{inc.id}</p>
                <Badge variant={statusVariant[inc.status] || 'neutral'}>{inc.status}</Badge>
              </div>
              <p className="text-sm text-neutral-900">{inc.type}</p>
              <p className="text-sm text-neutral-600">{inc.zone}</p>
              <p className="text-xs text-neutral-600 mt-1">Reported: {inc.date}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigate(`/warden/incidents/${inc.id}`)}
              >
                View
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}