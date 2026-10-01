import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { getIncidents } from '../../services/incidentService'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

const statusVariant = {
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  RESOLVED: 'success',
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    setError(false)
    getIncidents()
      .then(setIncidents)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-neutral-900">My Reports</h1>
        <Link to="/resident/incidents/report">
          <Button>Report Incident</Button>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && incidents.length === 0 && (
        <EmptyState title="No reports yet." description="Anything you report will show up here." />
      )}

      {!loading && !error && incidents.length > 0 && (
        <div className="space-y-3 max-w-md">
          {incidents.map((inc) => (
            <Link key={inc.id} to={`/resident/incidents/${inc.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-neutral-900">{inc.id}</p>
                  <Badge variant={statusVariant[inc.status] || 'neutral'}>{inc.status}</Badge>
                </div>
                <p className="text-sm text-neutral-900 mt-1">{inc.type}</p>
                <p className="text-sm text-neutral-600">{inc.zone}</p>
                <p className="text-xs text-neutral-600 mt-1">{inc.date}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}