import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getAuditLogs } from '../../services/auditService'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Audit Logs</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && (
        <Card className="w-full max-w-5xl">
  <div className="divide-y divide-neutral-200">
    
    {/* Header */}
    <div className="grid grid-cols-[1.2fr_1.2fr_1.5fr_1fr] gap-4 px-2 pb-2 text-xs font-semibold text-neutral-600 uppercase">
      <span>Timestamp</span>
      <span>Actor</span>
      <span>Action</span>
      <span>Resource</span>
    </div>

    {/* Logs */}
    {logs.map((log) => (
      <button
        key={log.id}
        onClick={() => navigate(`/admin/audit-logs/${log.id}`)}
        className="grid w-full grid-cols-[1.2fr_1.2fr_1.5fr_1fr] gap-4 px-2 py-3 text-sm text-left hover:bg-neutral-100 rounded"
      >
        <span className="min-w-0 text-neutral-600 break-words">
          {log.timestamp}
        </span>

        <span className="min-w-0 text-neutral-900 break-words">
          {log.actor}
        </span>

        <span className="min-w-0 text-neutral-900 font-medium break-words">
          {log.action}
        </span>

        <span className="min-w-0 text-neutral-600 break-words">
          {log.resource}
        </span>
      </button>
    ))}
  </div>
</Card>
      )}
    </DashboardLayout>
  )
}