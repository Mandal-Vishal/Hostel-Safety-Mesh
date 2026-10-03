import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getUsers } from '../../services/adminService'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

const roleVariant = {
  resident: 'neutral',
  warden: 'warning',
  security: 'success',
  admin: 'danger',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Users</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && (
        <Card className="max-w-3xl">
          <div className="divide-y divide-neutral-200">
            <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-neutral-600 uppercase pb-2">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Zone</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-4 gap-4 py-2.5 text-sm items-center">
                <span className="text-neutral-900 font-medium">{u.name}</span>
                <span className="text-neutral-600">{u.email}</span>
                <span><Badge variant={roleVariant[u.role]}>{u.role}</Badge></span>
                <span className="text-neutral-600">{u.zone}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}