import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getAuditLogDetails } from '../../services/auditService'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function AuditLogDetail() {
  const { id } = useParams()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAuditLogDetails(id)
      .then(setLog)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-md">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">Audit Log Detail</h1>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState />}

        {!loading && !error && log && (
          <Card>
            <p className="text-sm text-neutral-600">Event ID</p>
            <p className="text-neutral-900 font-medium mb-2">{log.id}</p>

            <p className="text-sm text-neutral-600">Action</p>
            <p className="text-neutral-900 font-medium mb-2">{log.action}</p>

            <p className="text-sm text-neutral-600">Actor</p>
            <p className="text-neutral-900 mb-2">{log.actor}</p>

            <p className="text-sm text-neutral-600">Timestamp</p>
            <p className="text-neutral-900 mb-2">{log.timestamp}</p>

            <p className="text-sm text-neutral-600">Resource</p>
            <p className="text-neutral-900 mb-2">{log.resource}</p>

            <p className="text-sm text-neutral-600">Integrity</p>
            <p className={log.verified ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
              {log.verified ? '✓ Verified' : '✗ Not Verified'}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}